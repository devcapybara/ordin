const Product = require('../../models/Product');
const { getRedis } = require('../../config/redis');

const createProduct = async (req, res) => {
  try {
    const { name, price, category, stock, imageUrl, description } = req.body;

    // req.restaurant is set by checkTenant middleware
    // req.user is set by protect middleware

    const product = await Product.create({
      restaurantId: req.user.restaurantId,
      name,
      price,
      category,
      stock,
      imageUrl,
      description,
      isAvailable: true
    });

    // Invalidate Cache
    const redis = getRedis();
    if (redis) {
        await redis.del(`products:${req.user.restaurantId}`);
    }

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

module.exports = createProduct;
