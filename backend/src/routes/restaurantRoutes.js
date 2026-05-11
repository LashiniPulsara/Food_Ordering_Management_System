const express = require('express');
const {
  registerRestaurant,
  getMyRestaurant,
  getRestaurants,
  getRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require('../controllers/restaurantController');

const { protect, isOwner } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router
  .route('/my/restaurant')
  .get(protect, isOwner, getMyRestaurant);

router
  .route('/')
  .get(getRestaurants)
  .post(protect, isOwner, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), registerRestaurant);

router
  .route('/:id')
  .get(getRestaurant)
  .put(protect, isOwner, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), updateRestaurant)
  .delete(protect, isOwner, deleteRestaurant);

module.exports = router;
