const Order = require('../../models/Order');
const { getIO } = require('../../config/socket');
const logActivity = require('../../utils/logger/logActivity');

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const order = await Order.findOne({ 
      _id: id, 
      restaurantId: req.user.restaurantId 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    
    // Also update item statuses and tickets if needed
    if (status === 'COOKING') {
      order.items.forEach(item => item.status = 'COOKING');
      if (order.tickets) order.tickets.forEach(t => t.status = 'COOKING');
    } else if (status === 'READY') {
      order.items.forEach(item => item.status = 'READY');
      if (order.tickets) order.tickets.forEach(t => t.status = 'READY');
    } else if (status === 'SERVED') {
      order.items.forEach(item => item.status = 'SERVED');
      if (order.tickets) order.tickets.forEach(t => t.status = 'SERVED');
    } else if (status === 'COMPLETED') {
        order.items.forEach(item => item.status = 'COMPLETED');
        if (order.tickets) order.tickets.forEach(t => t.status = 'COMPLETED');
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('items.productId', 'name imageUrl')
      .populate('waiterId', 'username');

    // Emit update
    const io = getIO();
    io.to(`restaurant_${req.user.restaurantId}`).emit('order_status_updated', updatedOrder);

    // Log Activity
    logActivity(
        req.user.restaurantId,
        req.user._id,
        'ORDER_STATUS_UPDATE',
        `Order #${order._id.toString().slice(-4)} status updated to ${status}`,
        { orderId: order._id, status, tableNumber: order.tableNumber }
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
};

module.exports = updateOrderStatus;
