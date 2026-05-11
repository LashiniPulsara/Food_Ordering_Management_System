const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Delivery must be linked to an order'],
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Transit', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  deliveryAddress: {
    type: String,
    required: [true, 'Please provide delivery address'],
  }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
