const Restaurant = require('../models/Restaurant');

// @desc    Register a new restaurant
// @route   POST /api/restaurants
// @access  Private (RestaurantOwner / Admin)
exports.registerRestaurant = async (req, res) => {
  try {
    const { restaurantName, email, phone, address, cuisineType, openingHours } = req.body;

    // Check if user already has a restaurant (optional, depends on business logic)
    const existingRestaurant = await Restaurant.findOne({ ownerName: req.user._id });
    if (existingRestaurant && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'You already have a registered restaurant' });
    }

    const restaurant = await Restaurant.create({
      restaurantName,
      ownerName: req.user._id,
      email,
      phone,
      address,
      cuisineType,
      openingHours,
      status: req.user.role === 'admin' ? 'approved' : 'pending',
      approvalNote: req.user.role === 'admin' ? 'Approved by system admin' : 'Waiting for admin approval',
      image: req.files && req.files['image'] ? req.files['image'][0].path.replace(/\\/g, '/') : 'no-photo.jpg',
      coverImage: req.files && req.files['coverImage'] ? req.files['coverImage'][0].path.replace(/\\/g, '/') : 'no-cover.jpg'
    });

    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current owner's restaurant
// @route   GET /api/restaurants/my/restaurant
// @access  Private (RestaurantOwner / Admin)
exports.getMyRestaurant = async (req, res) => {
  try {
    let restaurant;

    if (req.user.role === 'admin' && req.query.ownerId) {
      restaurant = await Restaurant.findOne({ ownerName: req.query.ownerId }).populate('ownerName', 'name email phone');
    } else {
      restaurant = await Restaurant.findOne({ ownerName: req.user._id }).populate('ownerName', 'name email phone');
    }

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant profile not found' });
    }

    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res) => {
  try {
    let query = { status: 'approved' };
    if (req.query.status && req.query.status !== 'all') {
      query = { status: req.query.status };
    }
    if (req.query.status === 'all') {
      query = {};
    }
    const restaurants = await Restaurant.find(query).populate('ownerName', 'name email phone');
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('ownerName', 'name email phone');
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (RestaurantOwner / Admin)
exports.updateRestaurant = async (req, res) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Make sure user is restaurant owner or admin
    if (restaurant.ownerName.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this restaurant' });
    }

    const updateData = { ...req.body };
    if (req.user.role !== 'admin') {
      delete updateData.status;
      delete updateData.approvalNote;
    }
    if (req.files) {
      if (req.files['image']) {
        updateData.image = req.files['image'][0].path.replace(/\\/g, '/');
      }
      if (req.files['coverImage']) {
        updateData.coverImage = req.files['coverImage'][0].path.replace(/\\/g, '/');
      }
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (RestaurantOwner / Admin)
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Make sure user is restaurant owner or admin
    if (restaurant.ownerName.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this restaurant' });
    }

    await restaurant.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
