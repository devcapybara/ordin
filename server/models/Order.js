const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true
  },
  quantity: { type: Number, required: true, min: 1 },
  note: { type: String },
  status: { 
    type: String, 
    enum: ['PENDING', 'COOKING', 'READY', 'SERVED'],
    default: 'PENDING'
  },
  unitPrice: { type: Number, required: true },
  paidQuantity: { type: Number, default: 0 } // Track how many of this item have been paid for
});

const paymentRecordSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  provider: { type: String, default: 'MANUAL' },
  status: { type: String, enum: ['PAID', 'REFUNDED'], default: 'PAID' },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paidAt: { type: Date, default: Date.now },
  note: String,
  // Optional: Track which items were covered by this payment
  items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      amount: Number
  }]
});

const orderSchema = new mongoose.Schema({
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant',
    required: true
  },
  tableNumber: { type: String, required: true },
  
  // [NEW] Xendit-Ready Fields
  orderNumber: { type: String, unique: true, sparse: true }, // generated in controller

  waiterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  cashierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  items: [orderItemSchema],
  status: { 
    type: String, 
    enum: ['PENDING', 'COOKING', 'READY', 'SERVED', 'PARTIAL_PAID', 'PAID', 'CANCELLED', 'COMPLETED'],
    default: 'PENDING'
  },
  totalAmount: { type: Number, required: true },
  
  // Breakdown fields
  subtotal: { type: Number },
  taxAmount: { type: Number },
  serviceChargeAmount: { type: Number },
  discountAmount: { type: Number, default: 0 },
  promoCode: { type: String },

  // [NEW] Multiple Payments Support (Split Bill)
  payments: [paymentRecordSchema],
  totalPaid: { type: Number, default: 0 },

  // [NEW] Structured Payment Object (Legacy/Summary)
  payment: {
    method: { type: String }, // 'CASH', 'BANK_TRANSFER', 'QRIS'
    provider: { type: String, enum: ['MANUAL', 'XENDIT'], default: 'MANUAL' },
    status: { 
        type: String, 
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], 
        default: 'PENDING' 
    },
    xenditDetails: {
        invoiceId: String,
        paymentUrl: String,
        paidAt: Date
    }
  },

  amountReceived: Number, // For Cash
  changeAmount: Number    // For Cash
}, { timestamps: true });

// Ensure unique index for orderNumber per restaurant if needed, but global unique is better for Xendit
orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
