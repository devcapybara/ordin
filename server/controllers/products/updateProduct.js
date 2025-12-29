const Product = require('../../models/Product');

const updateProduct = async (req, res) => {
  try {
    const { name, price, category, stock, imageUrl, description, isAvailable } = req.body;
    
    // Ensure the product belongs to the user's restaurant
    const product = await Product.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Role-based Restriction: KITCHEN can only update availability and stock
    if (req.user.role === 'KITCHEN') {
        product.stock = stock !== undefined ? stock : product.stock;
        product.isAvailable = isAvailable !== undefined ? isAvailable : product.isAvailable;
    } else {
        // Owner/Manager can update everything
        product.name = name || product.name;
        product.price = price || product.price;
        product.category = category || product.category;
        product.stock = stock !== undefined ? stock : product.stock;
        product.imageUrl = imageUrl || product.imageUrl;
        product.description = description || product.description;
        product.isAvailable = isAvailable !== undefined ? isAvailable : product.isAvailable;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

module.exports = updateProduct;
