const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  reviewText: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    default: null,
  },
  ownerReply: {
    type: String,
    default: null,
  }
}, { timestamps: true });

// Static method to get avg rating and save
reviewSchema.statics.getAverageRating = async function(restaurantId) {
  const obj = await this.aggregate([
    {
      $match: { restaurantId: restaurantId }
    },
    {
      $group: {
        _id: '$restaurantId',
        averageRating: { $avg: '$rating' },
        numOfReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    const calculatedRating = obj[0] ? obj[0].averageRating : 0;
    // Round to 1 decimal place
    const roundedRating = Math.round(calculatedRating * 10) / 10;
    
    await this.model('Restaurant').findByIdAndUpdate(restaurantId, {
      rating: roundedRating,
      numReviews: obj[0] ? obj[0].numOfReviews : 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.restaurantId);
});

// Call getAverageRating before remove
reviewSchema.pre('remove', function() {
  this.constructor.getAverageRating(this.restaurantId);
});

module.exports = mongoose.model('Review', reviewSchema);
