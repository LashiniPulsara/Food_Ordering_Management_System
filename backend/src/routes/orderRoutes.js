const express = require('express');
const {
  placeOrder,
  getMyOrders,
  getRestaurantOrders,
  getMyRestaurantOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');

const { protect, isAdmin, isOwner, deliveryRider } = require('../middlewares/auth');

const router = express.Router();

// Mixed role route: admin or deliveryRider can view global orders
// Only protect is applied here, and we explicitly check roles in the controller if needed, 
// OR we can create a generic role check middleware. 
// For simplicity, we just use protect and let controller handle specific role filtering.
router
  .route('/')
  .post(protect, placeOrder)
  .get(protect, getAllOrders);

router
  .route('/myorders')
  .get(protect, getMyOrders);

router
  .route('/owner/my-restaurant')
  .get(protect, isOwner, getMyRestaurantOrders);

router
  .route('/restaurant/:restaurantId')
  .get(protect, isOwner, getRestaurantOrders);

router
  .route('/:id/status')
  .put(protect, updateOrderStatus); // Controller checks if user is restaurantOwner, deliveryRider or admin

router
  .route('/:id/cancel')
  .put(protect, cancelOrder); // Only customer who owns it can cancel

module.exports = router;
