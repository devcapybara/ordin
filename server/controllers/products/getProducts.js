const Product = require('../../models/Product');
const { getRedis } = require('../../config/redis');

const getProducts = async (req, res) => {
  try {
    const redis = getRedis();
    const cacheKey = `products:${req.user.restaurantId}`;

    // 1. Try Cache
    if (redis) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    }

    // 2. Query DB
    // req.user.restaurantId is ensured by checkTenant middleware
    const products = await Product.find({ restaurantId: req.user.restaurantId });

    // 3. Set Cache (Expire in 1 hour / 3600 seconds)
    if (redis) {
      await redis.set(cacheKey, JSON.stringify(products), { EX: 3600 });
    }

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

module.exports = getProducts;
