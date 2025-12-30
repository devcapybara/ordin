const Restaurant = require('../../models/Restaurant');

const getConfigs = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId).select('name address phone configs');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching configs' });
  }
};

module.exports = getConfigs;
