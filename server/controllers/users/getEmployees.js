const User = require('../../models/User');

const getEmployees = async (req, res) => {
  try {
    // Ensure only users belonging to a restaurant can access
    if (!req.user.restaurantId) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const employees = await User.find({ 
        restaurantId: req.user.restaurantId,
        role: { $ne: 'SUPER_ADMIN' } 
    }).select('-password');

    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
};

module.exports = getEmployees;