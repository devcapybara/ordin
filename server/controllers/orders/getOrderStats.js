const Order = require('../../models/Order');
const mongoose = require('mongoose');

const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ensure restaurantId is an ObjectId
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);

    const stats = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurantId,
          createdAt: { $gte: today },
          status: { $nin: ['CANCELLED', 'VOID'] } // Exclude cancelled and voided orders
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      res.json({
        totalSales: stats[0].totalSales,
        totalOrders: stats[0].totalOrders
      });
    } else {
      res.json({ totalSales: 0, totalOrders: 0 });
    }
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

module.exports = getOrderStats;
