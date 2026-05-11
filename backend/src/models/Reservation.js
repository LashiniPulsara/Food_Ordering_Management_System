const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reservation must be linked to a user'],
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Reservation must be linked to a restaurant'],
  },
  customerName: {
    type: String,
    required: [true, 'Please provide customer name'],
  },
  customerPhone: {
    type: String,
    required: [true, 'Please provide customer phone number'],
  },
  advancePayment: {
    type: Number,
    default: 0,
  },
  tableNumber: {
    type: String,
    required: [true, 'Please provide table number or preference'],
  },
  reservationDate: {
    type: String, // String format YYYY-MM-DD or Date object
    required: [true, 'Please provide a reservation date'],
  },
  reservationTime: {
    type: String,
    required: [true, 'Please provide a reservation time'],
  },
  reservationEndTime: {
    type: String,
    default: ''
  },
  numberOfTables: {
    type: Number,
    default: 1,
    min: 1
  },
  guestCount: {
    type: Number,
    required: [true, 'Please provide number of guests'],
    min: 1
  },
  reservationStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
    default: 'Pending',
  }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
