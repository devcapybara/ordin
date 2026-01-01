const Restaurant = require('../../models/Restaurant');
const { getRedis } = require('../../config/redis');

const getConfigs = async (req, res) => {
  try {
    const redis = getRedis();
    const cacheKey = `restaurant_config:${req.user.restaurantId}`;

    // 1. Try Cache
    if (redis) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    }

    // 2. Query DB
    const restaurant = await Restaurant.findById(req.user.restaurantId).select('name address phone configs');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // 3. Set Cache (Long expiry - 24 hours)
    if (redis) {
      await redis.set(cacheKey, JSON.stringify(restaurant), { EX: 86400 });
    }

    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching configs' });
  }
};

module.exports = getConfigs;
