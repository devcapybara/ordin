const User = require('../../models/User');
const { isRoleDisabled } = require('../../services/roles');

// @desc    Update employee
// @route   PUT /api/users/:id
// @access  Private (Owner/Manager)
const updateEmployee = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Tenant check: an owner must never edit staff of another restaurant
    if (!user.restaurantId || user.restaurantId.toString() !== req.user.restaurantId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Authorization check: Only Owner or Manager can update (and Manager cannot update Owner)
    // Note: Middleware already checks role, but extra safety here is good
    if (req.user.role === 'MANAGER' && user.role === 'OWNER') {
        return res.status(403).json({ message: 'Managers cannot update Owner account' });
    }
    
    // Prevent Manager from updating another Manager (optional rule, but safer)
    if (req.user.role === 'MANAGER' && user.role === 'MANAGER' && req.user._id.toString() !== user._id.toString()) {
         return res.status(403).json({ message: 'Managers cannot update other Managers' });
    }

    // A role the owner has turned off cannot be assigned
    if (req.body.role && req.body.role !== user.role && isRoleDisabled(req.restaurant, req.body.role)) {
      return res.status(400).json({ message: `The ${req.body.role} role is turned off for this restaurant. Turn it on in Restaurant Settings first.` });
    }

    // Update fields
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    
    // Update PIN if provided (allow empty string to clear it? or just update if present)
    // Assuming if sent as empty string, it means clear it, or maybe just update if has value
    if (req.body.pin !== undefined) {
        user.pin = req.body.pin;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      pin: updatedUser.pin // Return pin so frontend knows it's set
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = updateEmployee;
