const Shift = require('../../models/Shift');
const Order = require('../../models/Order');

const getCurrentShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({
      userId: req.user._id,
      status: 'OPEN'
    });

    if (!shift) {
      return res.status(404).json({ message: 'No active shift found' });
    }

    // Optional: Calculate current sales in real-time for display
    const orders = await Order.find({
      restaurantId: req.user.restaurantId,
      cashierId: req.user._id, // Filter by Cashier who processed payment
      updatedAt: { $gte: shift.startTime }, // Processed during shift
      'payment.status': 'PAID'
    });

    const cashSales = orders
      .filter(o => o.payment?.method === 'CASH' && o.payment?.status === 'PAID')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
    const nonCashSales = orders
        .filter(o => o.payment?.method !== 'CASH' && o.payment?.status === 'PAID')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
        ...shift.toObject(),
        currentCashSales: cashSales,
        currentNonCashSales: nonCashSales
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = getCurrentShift;
