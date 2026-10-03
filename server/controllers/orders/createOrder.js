const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Ingredient = require('../../models/Ingredient');
const Restaurant = require('../../models/Restaurant');
const { getIO } = require('../../config/socket');
const logActivity = require('../../utils/logger/logActivity');
const paymentService = require('../../services/payment.service');
const { PromoError, resolvePromo, calculateOrderTotals } = require('../../services/orderTotals');

const createOrder = async (req, res) => {
  try {
    const { items, tableNumber, paymentPayload, promoCode, note } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // 1. Fetch Restaurant Config (Tax & Service Charge)
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }
    const { tax = 0.1, serviceCharge = 0.05 } = restaurant.configs || {};

    // 2. Fetch Products to get REAL prices and ingredients
    const productIds = items.map(item => item._id);
    const products = await Product.find({ 
        _id: { $in: productIds },
        restaurantId: req.user.restaurantId // Ensure products belong to this restaurant
    }).populate('recipe.ingredientId');

    // 3. Calculate Totals & Validate Items
    let subtotal = 0;
    const validatedItems = [];
    const ingredientUpdates = {}; 

    for (const item of items) {
        const product = products.find(p => p._id.toString() === item._id);
        
        if (!product) {
            return res.status(400).json({ message: `Product not found or invalid: ${item._id}` });
        }

        // Use price from DB
        const price = product.price; 
        const quantity = parseInt(item.quantity);

        if (isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ message: `Invalid quantity for product ${product.name}` });
        }

        const itemTotal = price * quantity;
        subtotal += itemTotal;

        validatedItems.push({
            productId: product._id,
            quantity: quantity,
            unitPrice: price,
            note: item.note || '',
            status: 'PENDING'
        });

        // Calculate Ingredient Usage
        if (product.recipe && product.recipe.length > 0) {
            for (const ing of product.recipe) {
                if (ing.ingredientId) {
                    const deduction = ing.quantity * quantity;
                    const ingId = ing.ingredientId._id.toString();
                    ingredientUpdates[ingId] = (ingredientUpdates[ingId] || 0) + deduction;
                }
            }
        }
    }

    // Promo: the discount is always recalculated on the server. Any discountAmount sent by the client is ignored.
    if (promoCode && typeof promoCode !== 'string') {
        return res.status(400).json({ message: 'Invalid promo code' });
    }
    let promo = { promoCode: undefined, discountAmount: 0 };
    if (promoCode) {
        try {
            promo = await resolvePromo(req.user.restaurantId, promoCode, subtotal);
        } catch (promoError) {
            if (promoError instanceof PromoError) {
                return res.status(400).json({ message: promoError.message });
            }
            throw promoError;
        }
    }
    const discountAmount = promo.discountAmount;

    const { taxAmount, serviceChargeAmount, totalAmount } = calculateOrderTotals({ subtotal, discountAmount, tax, serviceCharge });

    // 4. Update Ingredients (Parallel)
    const updatePromises = Object.keys(ingredientUpdates).map(ingId => 
        Ingredient.findByIdAndUpdate(ingId, { $inc: { currentStock: -ingredientUpdates[ingId] } })
    );
    await Promise.all(updatePromises);


    // Check if table is occupied
    const activeOrder = await Order.findOne({
      restaurantId: req.user.restaurantId,
      tableNumber,
      status: { $nin: ['COMPLETED', 'CANCELLED'] }
    });

    if (activeOrder) {
      return res.status(400).json({ message: `Table ${tableNumber} is currently occupied.` });
    }

    // Generate Order Number
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    // Prepare Payment Data
    let paymentData = {
        method: 'PAY_LATER',
        provider: 'MANUAL',
        status: 'PENDING'
    };
    let extraData = {};

    // If paymentPayload exists (Direct Pay from POS)
    if (paymentPayload) {
        // Use SERVER-CALCULATED totalAmount
        const orderData = { totalAmount }; 
        const result = await paymentService.processPayment(orderData, paymentPayload);
        
        paymentData = result.payment;
        extraData = {
            amountReceived: result.amountReceived,
            changeAmount: result.changeAmount
        };
    }

    const order = await Order.create({
      restaurantId: req.user.restaurantId,
      orderNumber,
      waiterId: req.user._id,
      tableNumber,
      items: validatedItems, // Use validated items
      totalAmount, // Server calculated
      subtotal, // Server calculated
      taxAmount, // Server calculated
      serviceChargeAmount, // Server calculated
      discountAmount, // Server calculated
      promoCode: promo.promoCode,
      payment: paymentData,
      ...extraData,
      status: 'PENDING',
      tickets: [{
        items: validatedItems.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          note: it.note
        })),
        createdAt: new Date()
      }]
     });

    // Populate product details
    const populatedOrder = await Order.findById(order._id)
      .populate('items.productId', 'name imageUrl')
      .populate('waiterId', 'username');

    // Emit socket event
    const io = getIO();
    io.to(`restaurant_${req.user.restaurantId}`).emit('new_order', populatedOrder);

    // Log Activity
    try {
        await logActivity(
            req.user.restaurantId,
            req.user._id,
            'ORDER_CREATED',
            `Order ${orderNumber} created for Table ${tableNumber}`,
            { orderId: order._id, tableNumber, totalAmount }
        );
    } catch (logErr) {
        console.error('Failed to log activity:', logErr.message);
    }

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating order', error: error.message });
  }
};

module.exports = createOrder;
