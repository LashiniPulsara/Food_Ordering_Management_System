const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

// @desc    Add a food item
// @route   POST /api/menu
// @access  Private (RestaurantOwner / Admin)
exports.addMenuItem = async (req, res) => {
  try {
    const { foodName, description, price, categoryId, restaurantId, availability, preparationTime } = req.body;

    // Verify restaurant exists and user owns it
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (req.user.role !== 'admin' && restaurant.status !== 'approved') {
      return res.status(403).json({ message: 'Restaurant is not approved yet' });
    }

    if (restaurant.ownerName.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to add menu items to this restaurant' });
    }

    const menuItem = await MenuItem.create({
      foodName,
      description,
      price,
      categoryId,
      restaurantId,
      availability: availability !== undefined ? availability : true,
      preparationTime,
      image: req.file ? req.file.path : 'no-photo.jpg'
    });

    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all food items (with optional search and category filter)
// @route   GET /api/menu
// @route   GET /api/menu/restaurant/:restaurantId
// @access  Public
exports.getMenuItems = async (req, res) => {
  try {
    let query = {};

    // Filter by restaurant if provided in params
    if (req.params.restaurantId) {
      query.restaurantId = req.params.restaurantId;
    }

    // Search by foodName
    if (req.query.search) {
      query.foodName = { $regex: req.query.search, $options: 'i' };
    }

    // Filter by category
    if (req.query.categoryId) {
      query.categoryId = req.query.categoryId;
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    const menuItems = await MenuItem.find(query).populate('categoryId', 'categoryName').populate('restaurantId', 'restaurantName');
    res.status(200).json({ success: true, count: menuItems.length, data: menuItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single food item
// @route   GET /api/menu/:id
// @access  Public
exports.getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('categoryId', 'categoryName').populate('restaurantId', 'restaurantName');
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update food item
// @route   PUT /api/menu/:id
// @access  Private (RestaurantOwner / Admin)
exports.updateMenuItem = async (req, res) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Verify ownership via related restaurant
    const restaurant = await Restaurant.findById(menuItem.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.ownerName.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this menu item' });
    }
    if (req.user.role !== 'admin' && restaurant.status !== 'approved') {
      return res.status(403).json({ message: 'Restaurant is not approved yet' });
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }

    menuItem = await MenuItem.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete food item
// @route   DELETE /api/menu/:id
// @access  Private (RestaurantOwner / Admin)
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Verify ownership via related restaurant
    const restaurant = await Restaurant.findById(menuItem.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (restaurant.ownerName.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this menu item' });
    }
    if (req.user.role !== 'admin' && restaurant.status !== 'approved') {
      return res.status(403).json({ message: 'Restaurant is not approved yet' });
    }

    await menuItem.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
