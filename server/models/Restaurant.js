const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerEmail: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, default: '' }, // Printed on receipts only when set
  subscription: {
    plan: { 
      type: String, 
      enum: ['BASIC', 'PRO', 'ENTERPRISE'], 
      default: 'BASIC' 
    },
    billingCycle: {
        type: String,
        enum: ['MONTHLY', 'YEARLY'],
        default: 'MONTHLY'
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'grace_period', 'pending_payment'], 
      default: 'active' 
    },
    validUntil: { type: Date }
  },
  branding: {
    appDisplayName: String,
    logoUrl: String,
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#10B981' }
  },
  configs: {
    tax: { type: Number, default: 0.1 },
    serviceCharge: { type: Number, default: 0.05 },
    totalTables: { type: Number, default: 12 },
    receiptFooter: { type: String, default: 'Thank you for your visit!' },
    // Staff roles the owner has switched off. Empty means every role is on.
    disabledRoles: { type: [{ type: String, enum: ['CASHIER', 'WAITER', 'KITCHEN'] }], default: [] }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
