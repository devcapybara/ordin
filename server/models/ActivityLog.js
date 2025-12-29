const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true, // e.g., 'LOGIN', 'ORDER_CREATED', 'ORDER_PAID', 'KITCHEN_UPDATE', 'EXPENSE_ADDED'
    index: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: Object, // Flexible storage for orderId, tableNumber, amount, etc.
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // For sorting by time
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);