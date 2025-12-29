const Order = require('../../models/Order');
const { getIO } = require('../../config/socket');

const clearTable = async (req, res) => {
  try {
    const { tableNumber } = req.body;

    // Find active order for this table
    const order = await Order.findOne({
      restaurantId: req.user.restaurantId,
      tableNumber,
      status: { $nin: ['COMPLETED', 'CANCELLED'] }
    });

    if (!order) {
      return res.status(404).json({ message: 'No active order found for this table' });
    }

    // Optional: Check if Paid
    // if (order.paymentStatus !== 'PAID') {
    //   return res.status(400).json({ message: 'Cannot clear table before payment' });
    // }

    order.status = 'COMPLETED';
    await order.save();

    // Emit update
    const io = getIO();
    io.to(`restaurant_${req.user.restaurantId}`).emit('table_cleared', { tableNumber });
    io.to(`restaurant_${req.user.restaurantId}`).emit('order_status_updated', order);

    res.json({ message: 'Table cleared', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error clearing table' });
  }
};

module.exports = clearTable;
