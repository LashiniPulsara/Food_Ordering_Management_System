const express = require('express');
const {
  reserveTable,
  getMyReservations,
  getRestaurantReservations,
  updateReservationStatus,
  cancelReservation
} = require('../controllers/reservationController');

const { protect, isOwner } = require('../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(protect, reserveTable);

router
  .route('/my-reservations')
  .get(protect, getMyReservations);

router
  .route('/restaurant/:restaurantId')
  .get(protect, isOwner, getRestaurantReservations);

router
  .route('/:id/status')
  .put(protect, updateReservationStatus);

router
  .route('/:id/cancel')
  .put(protect, cancelReservation);

module.exports = router;
