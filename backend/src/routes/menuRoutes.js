const express = require('express');
const {
  addMenuItem,
  getMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');

const { protect, isOwner } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getMenuItems)
  .post(protect, isOwner, upload.single('image'), addMenuItem);

router
  .route('/restaurant/:restaurantId')
  .get(getMenuItems);

router
  .route('/:id')
  .get(getMenuItem)
  .put(protect, isOwner, upload.single('image'), updateMenuItem)
  .delete(protect, isOwner, deleteMenuItem);

module.exports = router;
