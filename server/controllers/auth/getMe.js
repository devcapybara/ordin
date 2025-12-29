const User = require('../../models/User');
const Restaurant = require('../../models/Restaurant');

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    let subscriptionPlan = 'BASIC';
    if (user.role !== 'SUPER_ADMIN' && user.restaurantId) {
        const restaurant = await Restaurant.findById(user.restaurantId);
        if (restaurant) {
            subscriptionPlan = restaurant.subscription?.plan || 'BASIC';
        }
    }

    res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        subscriptionPlan
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};

module.exports = getMe;