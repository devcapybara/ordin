const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  code: { type: String, required: true, uppercase: true },
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED'],
    required: true
  },
  value: { type: Number, required: true }, // e.g., 10 for 10% or 5000 for Rp 5.000
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number }, // Only applicable for PERCENTAGE type
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique code per restaurant
promoSchema.index({ restaurantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Promo', promoSchema);
