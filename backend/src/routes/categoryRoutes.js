const express = require('express');
const {
  addCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const { protect, isOwner } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router
  .route('/')
  .get(getCategories)
  .post(protect, isOwner, upload.single('image'), addCategory);

router
  .route('/:id')
  .get(getCategory)
  .put(protect, isOwner, upload.single('image'), updateCategory)
  .delete(protect, isOwner, deleteCategory);

module.exports = router;
