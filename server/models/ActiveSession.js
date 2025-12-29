const mongoose = require('mongoose');

const activeSessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    index: true,
    required: true
  },
  deviceInfo: { type: String }, // User Agent or Device Name
  ipAddress: { type: String },
  lastActiveAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, expires: '24h' } // Auto-logout if inactive for 24h
});

module.exports = mongoose.model('ActiveSession', activeSessionSchema);