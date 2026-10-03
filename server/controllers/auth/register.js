const User = require('../../models/User');
const Restaurant = require('../../models/Restaurant');
const { generateToken } = require('../../services/auth/tokenService');

const register = async (req, res) => {
  try {
    // Public signup only creates a new restaurant owner. Role and restaurantId are never taken from the body,
    // otherwise anyone could register as SUPER_ADMIN or join another tenant. Staff accounts are created by an owner.
    const { username, email, password, restaurantName, phone } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || typeof username !== 'string') {
      return res.status(400).json({ message: 'Invalid registration data' });
    }

    if (!restaurantName) {
      return res.status(400).json({ message: 'Restaurant name is required for Owner registration' });
    }

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ message: 'Restaurant phone is required' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const restaurant = await Restaurant.create({
      name: restaurantName,
      ownerEmail: email,
      phone: phone || '',
      subscriptionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year free trial for now
    });

    // Create User
    const user = await User.create({
      username,
      email,
      password,
      role: 'OWNER',
      restaurantId: restaurant._id,
    });

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = register;
