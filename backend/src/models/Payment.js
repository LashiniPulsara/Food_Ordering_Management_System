const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Payment must be linked to an order'],
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Card', 'Online'],
    required: [true, 'Please specify a payment method'],
  },
  amount: {
    type: Number,
    required: [true, 'Please provide the payment amount'],
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
