const ActivityLog = require('../../models/ActivityLog');

const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build Query
    const query = { restaurantId: req.user.restaurantId };

    // Filter by User
    if (req.query.userId) {
      query.user = req.query.userId;
    }

    // Filter by Action
    if (req.query.action) {
      query.action = req.query.action;
    }

    // Filter by Date (Full Day in Server Time/UTC)
    if (req.query.date) {
      const dateStr = req.query.date; // YYYY-MM-DD
      const startDate = new Date(dateStr);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateStr);
      endDate.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const logs = await ActivityLog.find(query)
      .populate('user', 'username role') 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      logs: logs, 
      pages: Math.ceil(total / limit),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getLogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
};

module.exports = getLogs;
