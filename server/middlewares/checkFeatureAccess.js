const Restaurant = require('../models/Restaurant');

const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.restaurantId) {
        return res.status(403).json({ message: 'No restaurant context found' });
      }

      const restaurant = await Restaurant.findById(req.user.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      const plan = restaurant.subscription?.plan || 'BASIC';

      // Feature Rules
      // INVENTORY & FINANCE: Only for PRO and ENTERPRISE
      if ((feature === 'INVENTORY' || feature === 'FINANCE') && plan === 'BASIC') {
        return res.status(403).json({ 
          code: 'UPGRADE_REQUIRED',
          message: `Feature ${feature} is not available in BASIC plan. Please upgrade to PRO.` 
        });
      }

      // BRANDING: Only for ENTERPRISE
      if (feature === 'BRANDING' && plan !== 'ENTERPRISE') {
        return res.status(403).json({ 
            code: 'UPGRADE_REQUIRED',
            message: `Feature ${feature} is only available in ENTERPRISE plan.` 
          });
      }

      // Attach restaurant to req for convenience
      req.restaurant = restaurant;
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error checking feature access' });
    }
  };
};

module.exports = checkFeatureAccess;