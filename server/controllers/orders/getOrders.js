const Order = require('../../models/Order');

const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = { restaurantId: req.user.restaurantId };
    
    if (status) {
      const statuses = status.split(',');
      if (statuses.length > 1) {
        query.status = { $in: statuses };
      } else {
        query.status = status;
      }
    } else {
      // Default: show active orders including those served and paid but not yet CLEARED
      query.status = { $in: ['PENDING', 'COOKING', 'READY', 'SERVED', 'PAID'] };
    }

    const orders = await Order.find(query)
      .populate('items.productId', 'name imageUrl')
      .populate('waiterId', 'username')
      .sort({ createdAt: 1 }); // Oldest first

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

module.exports = getOrders;
