const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  foodName: {
    type: String,
    required: [true, 'Please add a food name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Menu item must belong to a category'],
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Menu item must belong to a restaurant'],
  },
  availability: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    required: [true, 'Please add a preparation time in minutes']
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
