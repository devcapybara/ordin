const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Ingredient = require('../../models/Ingredient');
const Restaurant = require('../../models/Restaurant');
const { getIO } = require('../../config/socket');
const logActivity = require('../../utils/logger/logActivity');
const paymentService = require('../../services/payment.service');

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

    // Apply Discount (If promo code logic exists, it should be validated here too)
    // For now, we'll assume discountAmount comes from a trusted source or we need to recalculate it.
    // Since promo logic is complex, let's assume 0 for now or rely on a validatePromo function.
    // TODO: Validate promoCode against Promo model if provided.
    let discountAmount = 0; 
    // IF you have promo logic, uncomment and implement:
    // if (promoCode) { const promo = await validatePromo(promoCode); discountAmount = calculateDiscount(subtotal, promo); }
    // For now, to prevent client manipulation, we ignore req.body.discountAmount unless we validate it.
    // If the client sends discountAmount, we should probably REJECT it or VALIDATE it.
    // Safeguard: If user provided discountAmount, we should probably check it. 
    // For this fix, I will set it to 0 or use the client's value ONLY IF we trust the client logic (which we shouldn't).
    // Let's rely on the fact that we need to implement promo validation properly. 
    // For now, I'll accept discountAmount ONLY if it's 0. If it's > 0, we'll strip it unless we validate.
    // However, existing code might rely on client calc. I will log a warning if it differs? 
    // Let's just use 0 for safety or keep it if it's not critical for this specific audit task (Price manipulation is the main one).
    // Let's use 0 to be safe.
    if (req.body.discountAmount) {
        // console.warn('Client provided discountAmount ignored for security. Implement server-side promo validation.');
    }

    // Calculate Final Totals
    const taxAmount = subtotal * tax;
    const serviceChargeAmount = subtotal * serviceCharge;
    const totalAmount = subtotal + taxAmount + serviceChargeAmount - discountAmount;

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
      discountAmount, // Safe default or validated
      promoCode,
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
