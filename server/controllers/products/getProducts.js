const Product = require('../../models/Product');

const getProducts = async (req, res) => {
  try {
    // req.user.restaurantId is ensured by checkTenant middleware
    const products = await Product.find({ restaurantId: req.user.restaurantId });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

module.exports = getProducts;
