const Restaurant = require('../../models/Restaurant');

const getConfigs = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId).select('configs');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant.configs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching configs' });
  }
};

module.exports = getConfigs;
