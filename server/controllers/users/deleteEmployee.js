const User = require('../../models/User');

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user.restaurantId) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const employee = await User.findById(id);

    if (!employee) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (employee.restaurantId.toString() !== req.user.restaurantId.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this user' });
    }

    // Role Hierarchy Checks
    if (req.user.role === 'MANAGER') {
        if (employee.role === 'OWNER' || employee.role === 'MANAGER') {
            return res.status(403).json({ message: 'Managers cannot delete Owners or other Managers' });
        }
    }

    if (req.user._id.toString() === employee._id.toString()) {
        return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'Employee deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting employee' });
  }
};

module.exports = deleteEmployee;