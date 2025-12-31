const mongoose = require('mongoose');

const globalConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'MAIN_ADMIN_CONTACT'
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('GlobalConfig', globalConfigSchema);