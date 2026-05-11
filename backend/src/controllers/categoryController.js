const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Add a category
// @route   POST /api/categories
// @access  Private (Admin / Owner)
exports.addCategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;

    if (!categoryName || !description) {
      return res.status(400).json({ message: 'Please provide category name and description' });
    }

    let restaurantId = null;
    if (req.user && req.user.role === 'restaurantOwner') {
      const restaurant = await Restaurant.findOne({ ownerName: req.user._id });
      if (restaurant) {
        restaurantId = restaurant._id;
      } else {
         return res.status(400).json({ message: 'Restaurant profile not found for this owner.' });
      }
    }

    const category = await Category.create({
      categoryName,
      description,
      restaurantId,
      image: req.file ? req.file.path : 'no-photo.jpg'
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all categories (Global + Store Specific)
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    let query = { restaurantId: null };

    // Check for authorization header to fetch store-specific categories
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user && user.role === 'restaurantOwner') {
          const restaurant = await Restaurant.findOne({ ownerName: user._id });
          if (restaurant) {
            query = { $or: [{ restaurantId: null }, { restaurantId: restaurant._id }] };
          }
        }
      } catch (err) {
        // Ignore token errors and just return global categories
      }
    }

    const categories = await Category.find(query).sort('categoryName');
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin / Owner)
exports.updateCategory = async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // If owner, check if they own it
    if (req.user.role === 'restaurantOwner') {
      const restaurant = await Restaurant.findOne({ ownerName: req.user._id });
      if (!restaurant || category.restaurantId?.toString() !== restaurant._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to update this category' });
      }
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }

    category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin / Owner)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // If owner, check if they own it
    if (req.user.role === 'restaurantOwner') {
      const restaurant = await Restaurant.findOne({ ownerName: req.user._id });
      if (!restaurant || category.restaurantId?.toString() !== restaurant._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to delete this category' });
      }
    }

    await category.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
