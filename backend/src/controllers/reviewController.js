const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { restaurantId, rating, reviewText } = req.body;

    if (!restaurantId || !rating || !reviewText) {
      return res.status(400).json({ message: 'Restaurant, rating, and review text are required' });
    }

    const reviewData = {
      restaurantId,
      userId: req.user._id,
      rating: Number(rating),
      reviewText,
    };

    if (req.file) {
      reviewData.photo = req.file.path.replace(/\\/g, '/');
    }

    const review = await Review.create(reviewData);

    // Calculate new average rating for the restaurant (optional, if we track it in Restaurant model)
    
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews for a restaurant
// @route   GET /api/reviews/restaurant/:restaurantId
// @access  Public
exports.getRestaurantReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ restaurantId: req.params.restaurantId })
      .populate('userId', 'name profilePhoto')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reply to a review (Owner only)
// @route   PUT /api/reviews/:id/reply
// @access  Private (RestaurantOwner)
exports.replyToReview = async (req, res) => {
  try {
    const { ownerReply } = req.body;
    
    if (!ownerReply) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const restaurant = await Restaurant.findById(review.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Ensure the current user is the owner of the restaurant
    if (restaurant.ownerName.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to reply to this review' });
    }

    review.ownerReply = ownerReply;
    await review.save();

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
