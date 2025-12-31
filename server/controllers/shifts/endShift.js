const Shift = require('../../models/Shift');
const Order = require('../../models/Order');

const endShift = async (req, res) => {
  try {
    const { actualCash, note } = req.body;
    
    const shift = await Shift.findOne({
      userId: req.user._id,
      status: 'OPEN'
    });

    if (!shift) {
      return res.status(404).json({ message: 'No active shift found' });
    }

    // Calculate Sales during this shift
    // We strictly look for orders PAID during this shift. 
    // Since we don't have 'paidAt' in all orders, we use updatedAt for PAID orders > startTime
    const orders = await Order.find({
        restaurantId: req.user.restaurantId,
        cashierId: req.user._id,
        updatedAt: { $gte: shift.startTime },
        'payment.status': 'PAID'
    });

    const cashSales = orders
        .filter(o => o.payment?.method === 'CASH')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const nonCashSales = orders
        .filter(o => o.payment?.method !== 'CASH')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const expectedCash = shift.startCash + cashSales;
    const difference = actualCash - expectedCash;

    shift.endTime = new Date();
    shift.endCash = actualCash;
    shift.cashSales = cashSales;
    shift.nonCashSales = nonCashSales;
    shift.expectedCash = expectedCash;
    shift.difference = difference;
    shift.status = 'CLOSED';
    shift.note = note;

    await shift.save();

    res.json(shift);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = endShift;
