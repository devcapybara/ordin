const Order = require('../../models/Order');

const getOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    console.log('--- getOrders Debug ---');
    console.log('User:', req.user._id, 'Restaurant:', req.user.restaurantId);
    console.log('Query Params:', { status, startDate, endDate });

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
    if (startDate) {
        // Helper to create date in LOCAL time boundary
        // using explicit constructor new Date(y, m, d) avoids UTC interpretation of ISO strings
        const parseLocalDay = (dateStr, isEndOfDay) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            // Month is 0-indexed in JS Date
            const date = new Date(y, m - 1, d); 
            if (isEndOfDay) {
                date.setHours(23, 59, 59, 999);
            } else {
                date.setHours(0, 0, 0, 0);
            }
            return date;
        };

        let start, end;
        if (startDate && endDate) {
            start = parseLocalDay(startDate, false);
            end = parseLocalDay(endDate, true);
        } else {
            start = parseLocalDay(startDate, false);
            end = parseLocalDay(startDate, true);
        }
        
        query.createdAt = { $gte: start, $lte: end };
        
        console.log('Date Range Constructed (Local approach):');
        console.log('Start:', start.toString());
        console.log('End:', end.toString());
    }

    console.log('Final Mongo Query:', JSON.stringify(query, null, 2));

    const orders = await Order.find(query)
      .populate('items.productId', 'name imageUrl')
      .populate('waiterId', 'username')
      .sort({ createdAt: 1 }); 

    console.log(`Found ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    console.error('getOrders Error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

module.exports = getOrders;
