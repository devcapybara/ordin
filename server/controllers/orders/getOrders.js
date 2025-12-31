const Order = require('../../models/Order');

const getOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let query = { restaurantId: req.user.restaurantId };
    
    // Status Filter
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

    // Date Range Filter (e.g., for History)
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        query.createdAt = { $gte: start, $lte: end };
    } else if (startDate) {
        // Only start date provided (e.g. "Today")
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        
        query.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(query)
      .populate('items.productId', 'name imageUrl')
      .populate('waiterId', 'username')
      .sort({ createdAt: 1 }); // Oldest first (will be re-sorted by client if needed)

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

module.exports = getOrders;
