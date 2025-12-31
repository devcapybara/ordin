const Order = require('../../models/Order');
const Restaurant = require('../../models/Restaurant');

const getTableStatus = async (req, res) => {
  try {
    // Fetch restaurant config for total tables
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    const totalTables = restaurant?.configs?.totalTables || 12;

    const tables = Array.from({ length: totalTables }, (_, i) => ({
      number: (i + 1).toString(),
      status: 'AVAILABLE',
      orderId: null
    }));

    // Find active orders (Not COMPLETED and Not CANCELLED)
    const activeOrders = await Order.find({
      restaurantId: req.user.restaurantId,
      status: { $nin: ['COMPLETED', 'CANCELLED'] }
    });

    activeOrders.forEach(order => {
      // Handle potentially deleted/renumbered tables:
      // If order is for table "15" but we reduced total to 10, it won't show in grid,
      // but that's expected behavior (or we should append it?).
      // For now, only map within valid range.
      const tableIndex = tables.findIndex(t => t.number === order.tableNumber);
      if (tableIndex !== -1) {
        tables[tableIndex].orderId = order._id;
        
        // Priority: PAID (Dirty) > SERVED > OCCUPIED
        if (order.status === 'PAID') {
            tables[tableIndex].status = 'DIRTY'; 
        } else if (order.status === 'PARTIAL_PAID') {
            tables[tableIndex].status = 'PARTIAL_PAID';
        } else if (order.status === 'SERVED') {
            tables[tableIndex].status = 'SERVED';
        } else {
            tables[tableIndex].status = 'OCCUPIED';
        }
      }
    });

    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching table status' });
  }
};

module.exports = getTableStatus;
