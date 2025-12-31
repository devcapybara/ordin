const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant',
    required: true
  },
  name: { type: String, required: true },
  unit: { type: String, required: true }, // e.g., 'kg', 'g', 'l', 'ml', 'pcs'
  currentStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 }, // Alert threshold
  costPerUnit: { type: Number, default: 0 }, // For COGS calculation
}, { timestamps: true });

// Prevent duplicate names per restaurant
ingredientSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Ingredient', ingredientSchema);
