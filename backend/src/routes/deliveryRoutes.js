const express = require('express');
const {
  getDeliveries,
  createDelivery,
  assignRider,
  claimDelivery,
  updateDeliveryStatus,
  trackDelivery
} = require('../controllers/deliveryController');

const { protect } = require('../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, getDeliveries)
  .post(protect, createDelivery);

router
  .route('/my-deliveries')
  .get(protect, getDeliveries);

router
  .route('/:id/assign')
  .put(protect, assignRider);

router
  .route('/:id/claim')
  .put(protect, claimDelivery);

router
  .route('/:id/status')
  .put(protect, updateDeliveryStatus);

router
  .route('/:id/track')
  .get(protect, trackDelivery);

module.exports = router;
