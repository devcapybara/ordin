const Product = require('../../models/Product');
const { getRedis } = require('../../config/redis');

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Invalidate Cache
    const redis = getRedis();
    if (redis) {
        await redis.del(`products:${req.user.restaurantId}`);
    }

    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

module.exports = deleteProduct;
