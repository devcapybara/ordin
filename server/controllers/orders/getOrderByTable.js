const Order = require('../../models/Order');

const getOrderByTable = async (req, res) => {
  try {
    const { tableNumber } = req.params;

    const order = await Order.findOne({
      restaurantId: req.user.restaurantId,
      tableNumber,
      status: { $nin: ['COMPLETED', 'CANCELLED'] }
    })
    .populate('items.productId', 'name price')
    .populate('waiterId', 'username');

    if (!order) {
      return res.status(404).json({ message: 'No active order found for this table' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching order' });
  }
};

module.exports = getOrderByTable;
