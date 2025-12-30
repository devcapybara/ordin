const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  endTime: {
    type: Date
  },
  startCash: {
    type: Number,
    required: true,
    default: 0
  },
  endCash: {
    type: Number // Actual cash counted by cashier
  },
  expectedCash: {
    type: Number // Calculated system cash (startCash + cashSales)
  },
  cashSales: {
    type: Number,
    default: 0
  },
  nonCashSales: {
    type: Number,
    default: 0
  },
  difference: {
    type: Number // endCash - expectedCash
  },
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED'],
    default: 'OPEN'
  },
  note: String
}, { timestamps: true });

// Ensure a user can only have one OPEN shift at a time
// shiftSchema.index({ userId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'OPEN' } });

module.exports = mongoose.model('Shift', shiftSchema);
