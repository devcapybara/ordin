const User = require('../../models/User');
const Restaurant = require('../../models/Restaurant');
const { generateToken } = require('../../services/auth/tokenService');

const register = async (req, res) => {
  try {
    const { username, email, password, role, restaurantName, restaurantId, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let userRestaurantId = restaurantId;

    // If role is OWNER, create a new Restaurant
    if (role === 'OWNER') {
      if (!restaurantName) {
        return res.status(400).json({ message: 'Restaurant name is required for Owner registration' });
      }
      
      const restaurant = await Restaurant.create({
        name: restaurantName,
        ownerEmail: email,
        phone: phone || '',
        subscriptionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year free trial for now
      });
      
      userRestaurantId = restaurant._id;
    } else {
      // For non-owner, restaurantId is required
      if (!userRestaurantId && role !== 'SUPER_ADMIN') {
        return res.status(400).json({ message: 'Restaurant ID is required' });
      }
    }

    // Create User
    const user = await User.create({
      username,
      email,
      password,
      role,
      restaurantId: userRestaurantId,
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
