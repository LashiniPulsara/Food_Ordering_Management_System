const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  orderStatus: {
    type: String,
    enum: [
      'Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled',
      'Order Ready', 'Served'
    ],
    default: 'Pending',
  },
  orderType: {
    type: String,
    enum: ['Delivery', 'Dine-in'],
    required: [true, 'Please specify order type (Delivery or Dine-in)']
  },
  arrivalTime: {
    type: String,
  },
  tableNumber: {
    type: Number,
  },
  deliveryAddress: {
    type: String,
  },
  deliveryPhone: {
    type: String,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Card'],
    required: [true, 'Please select a payment method'],
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
