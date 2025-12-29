const User = require('../../models/User');

const createEmployee = async (req, res) => {
  try {
    const { username, email, password, role, pin } = req.body;

    if (!req.user.restaurantId) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    // Role Permission Check
    if (req.user.role === 'MANAGER') {
        if (role === 'OWNER' || role === 'MANAGER' || role === 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Managers can only create Cashier, Waiter, or Kitchen accounts.' });
        }
    }

    if (req.user.role === 'OWNER') {
        if (role === 'SUPER_ADMIN') {
             return res.status(403).json({ message: 'Cannot create Super Admin.' });
        }
    }

    // Check existing
    const userExists = await User.findOne({ 
        $or: [{ email }, { username }] 
    });

    if (userExists) {
        return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const user = await User.create({
        restaurantId: req.user.restaurantId,
        username,
        email,
        password,
        role,
        pin
    });

    res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating employee' });
  }
};

module.exports = createEmployee;