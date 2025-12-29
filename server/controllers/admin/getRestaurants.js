const Restaurant = require('../../models/Restaurant');

const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching restaurants' });
  }
};

module.exports = getRestaurants;