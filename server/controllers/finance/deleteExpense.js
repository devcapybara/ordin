const Expense = require('../../models/Expense');

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user.restaurantId) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const expense = await Expense.findById(id);

    if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.restaurantId.toString() !== req.user.restaurantId.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(id);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting expense' });
  }
};

module.exports = deleteExpense;