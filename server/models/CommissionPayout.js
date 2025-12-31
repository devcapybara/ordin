const mongoose = require('mongoose');

const commissionPayoutSchema = new mongoose.Schema({
  salesId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  periodMonth: { type: Number, required: true }, // 1-12
  periodYear: { type: Number, required: true }, // 2025
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PAID'], default: 'PAID' },
  proofUrl: { type: String, required: true },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CommissionPayout', commissionPayoutSchema);