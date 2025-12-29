const Expense = require('../../models/Expense');

const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    if (!req.user.restaurantId) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    let query = { restaurantId: req.user.restaurantId };

    if (startDate && endDate) {
        query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    if (category) {
        query.category = category;
    }

    const expenses = await Expense.find(query)
        .sort({ date: -1 })
        .populate('recordedBy', 'username');

    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching expenses' });
  }
};

module.exports = getExpenses;