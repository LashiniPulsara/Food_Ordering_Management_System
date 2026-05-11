const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    required: [true, 'Please add a restaurant name'],
    trim: true,
  },
  ownerName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
  },
  secondaryPhone: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
  },
  cuisineType: {
    type: String,
    required: [true, 'Please add a cuisine type'],
  },
  openingHours: {
    type: String,
    required: [true, 'Please add opening hours'],
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
  numberOfTables: {
    type: Number,
    default: 0
  },
  chairsPerTable: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  coverImage: {
    type: String,
    default: 'no-cover.jpg'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  rating: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  approvalNote: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
