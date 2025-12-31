const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Ingredient = require('../../models/Ingredient');
const { getIO } = require('../../config/socket');
const logActivity = require('../../utils/logger/logActivity');
const paymentService = require('../../services/payment.service');

const createOrder = async (req, res) => {
  try {
    const { items, tableNumber, totalAmount, paymentPayload, subtotal, taxAmount, serviceChargeAmount, discountAmount, promoCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // [INVENTORY LOGIC] Deduct Stock
    // 1. Get all product IDs
    const productIds = items.map(item => item._id);
    const products = await Product.find({ _id: { $in: productIds } }).populate('recipe.ingredientId');

    // 2. Calculate total ingredient usage
    const ingredientUpdates = {}; // { ingredientId: totalAmountToDeduct }

    for (const item of items) {
        const product = products.find(p => p._id.toString() === item._id);
        if (product && product.recipe && product.recipe.length > 0) {
            for (const ing of product.recipe) {
                if (ing.ingredientId) {
                    const deduction = ing.quantity * item.quantity;
                    const ingId = ing.ingredientId._id.toString();
                    ingredientUpdates[ingId] = (ingredientUpdates[ingId] || 0) + deduction;
                }
            }
        }
    }

    // 3. Update Ingredients (Parallel)
    // Note: We allow stock to go negative for now to not block sales
    const updatePromises = Object.keys(ingredientUpdates).map(ingId => 
        Ingredient.findByIdAndUpdate(ingId, { $inc: { currentStock: -ingredientUpdates[ingId] } })
    );
    await Promise.all(updatePromises);


    // Check if table is occupied (has any order not COMPLETED or CANCELLED)
    const activeOrder = await Order.findOne({
      restaurantId: req.user.restaurantId,
      tableNumber,
      status: { $nin: ['COMPLETED', 'CANCELLED'] }
    });

    if (activeOrder) {
      return res.status(400).json({ message: `Table ${tableNumber} is currently occupied.` });
    }

    // Generate Order Number (Unique ID for Xendit)
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    // Prepare Payment Data
    let paymentData = {
        method: 'PAY_LATER', // Default for Waiter
        provider: 'MANUAL',
        status: 'PENDING'
    };
    let extraData = {};

    // If paymentPayload exists (Direct Pay from POS)
    if (paymentPayload) {
        // Calculate total amount for validation
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
      items: items.map(item => ({
        productId: item._id,
        quantity: item.quantity,
        unitPrice: item.price,
        note: item.note || '',
        status: 'PENDING'
      })),
      totalAmount,
      subtotal,
      taxAmount,
      serviceChargeAmount,
      discountAmount,
      promoCode,
      // New Payment Structure
       payment: paymentData,
       ...extraData,
       
       // CRITICAL FIX: Order status should remain PENDING (for Kitchen) even if Payment is PAID.
       // Only payment.status tracks the money. 'status' tracks the fulfillment.
       status: 'PENDING',
       tickets: [{
         items: items.map(it => ({
           productId: it._id,
           quantity: it.quantity,
           note: it.note || ''
         })),
         createdAt: new Date()
       }]
     });

    // Populate product details for the response and socket event
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
