const Expense = require('../../models/Expense');

const createExpense = async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;

    if (!req.user.restaurantId) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const expense = await Expense.create({
      restaurantId: req.user.restaurantId,
      description,
      amount,
      category,
      date: date || Date.now(),
      recordedBy: req.user._id
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating expense' });
  }
};

module.exports = createExpense;