const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  imageUrl: { type: String },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
