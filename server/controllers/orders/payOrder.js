const Order = require('../../models/Order');
const { getIO } = require('../../config/socket');
const logActivity = require('../../utils/logger/logActivity');
const paymentService = require('../../services/payment.service');

const payOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.restaurantId.toString() !== req.user.restaurantId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Process Payment via Service
    const paymentResult = await paymentService.processPayment(order, req.body);

    // Update Order
    order.payment = paymentResult.payment;
    order.amountReceived = paymentResult.amountReceived;
    order.changeAmount = paymentResult.changeAmount;
    
    // Sync main status if Paid
    if (order.payment.status === 'PAID') {
        order.status = 'PAID';
    }

    await order.save();

    // Emit event
    const io = getIO();
    io.to(`restaurant_${req.user.restaurantId}`).emit('order_paid', order);

    // Log Activity
    logActivity(
        req.user.restaurantId,
        req.user._id,
        'ORDER_PAID',
        `Order ${order.orderNumber || order._id.toString().slice(-4)} paid via ${order.payment.method}`,
        { 
            orderId: order._id, 
            amount: order.totalAmount, 
            method: order.payment.method,
            provider: order.payment.provider
        }
    );

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing payment', error: error.message });
  }
};

module.exports = payOrder;
