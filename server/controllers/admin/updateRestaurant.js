const Restaurant = require('../../models/Restaurant');

const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionStatus, subscriptionExpiry, totalTables, plan } = req.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Initialize subscription object if missing (migration)
    if (!restaurant.subscription) {
        restaurant.subscription = {
            plan: 'BASIC',
            status: restaurant.subscriptionStatus || 'active',
            validUntil: restaurant.subscriptionExpiry || new Date()
        };
    }

    if (subscriptionStatus) restaurant.subscription.status = subscriptionStatus;
    if (subscriptionExpiry) restaurant.subscription.validUntil = subscriptionExpiry;
    if (plan) restaurant.subscription.plan = plan;
    
    if (totalTables) restaurant.configs.totalTables = totalTables;

    await restaurant.save();

    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating restaurant' });
  }
};

module.exports = updateRestaurant;