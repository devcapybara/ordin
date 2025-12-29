const Restaurant = require('../models/Restaurant');

const checkTenant = async (req, res, next) => {
  // Super Admin can access all data, so we might skip this or handle it specifically
  // But usually Super Admin operations are different. 
  // For standard tenant operations:

  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (req.user.role === 'SUPER_ADMIN') {
    // Super Admin bypasses tenant check, but should ideally provide restaurantId in query if acting on behalf
    return next();
  }

  if (!req.user.restaurantId) {
    return res.status(403).json({ message: 'User is not associated with a restaurant' });
  }

  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check new schema first, then fallback (if migration not complete)
    const status = restaurant.subscription?.status || restaurant.subscriptionStatus;

    if (status !== 'active' && status !== 'grace_period') {
      return res.status(403).json({ message: 'Restaurant subscription is inactive' });
    }

    // Attach restaurant to request for easy access
    req.restaurant = restaurant;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error checking tenant status' });
  }
};

module.exports = checkTenant;
