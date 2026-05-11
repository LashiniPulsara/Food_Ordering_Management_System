const express = require('express');
const router = express.Router();
const { createReview, getRestaurantReviews, replyToReview } = require('../controllers/reviewController');
const { protect, isOwner } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.route('/')
  .post(protect, upload.single('photo'), createReview);

router.route('/restaurant/:restaurantId')
  .get(getRestaurantReviews);

router.route('/:id/reply')
  .put(protect, isOwner, replyToReview);

module.exports = router;
