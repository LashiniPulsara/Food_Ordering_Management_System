const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Delivery = require('../models/Delivery');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Customer)
exports.placeOrder = async (req, res) => {
  try {
    const { restaurantId, items, totalAmount, deliveryAddress, deliveryPhone, paymentMethod, orderType, tableNumber, arrivalTime } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item not found` });
      }
      if (!menuItem.availability) {
        return res.status(400).json({ message: `Sorry, ${menuItem.foodName} is currently unavailable` });
      }
    }

    if (!orderType || !['Delivery', 'Dine-in'].includes(orderType)) {
      return res.status(400).json({ message: 'Please specify a valid order type (Delivery or Dine-in)' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (orderType === 'Delivery') {
      if (!deliveryAddress) return res.status(400).json({ message: 'Delivery address is required for Delivery orders' });
      if (!deliveryPhone) return res.status(400).json({ message: 'Delivery phone number is required for Delivery orders' });
    }

    if (orderType === 'Dine-in') {
      if (!tableNumber) {
        return res.status(400).json({ message: 'Table number is required for Dine-in orders' });
      }
      if (tableNumber < 1 || tableNumber > restaurant.numberOfTables) {
        return res.status(400).json({ message: `Invalid table number. Restaurant only has ${restaurant.numberOfTables} tables.` });
      }
    }

    const order = await Order.create({
      userId: req.user._id,
      restaurantId,
      items,
      totalAmount,
      orderType,
      tableNumber: orderType === 'Dine-in' ? tableNumber : undefined,
      arrivalTime: orderType === 'Dine-in' ? arrivalTime : undefined,
      deliveryAddress: orderType === 'Delivery' ? deliveryAddress : undefined,
      deliveryPhone: orderType === 'Delivery' ? deliveryPhone : undefined,
      paymentMethod,
      orderStatus: 'Pending'
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's past/current orders
// @route   GET /api/orders/myorders
// @access  Private (Customer)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('restaurantId', 'restaurantName address')
      .populate('items.menuItem', 'foodName image')
      .sort('-createdAt');
      
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get orders for a restaurant (for restaurant owners)
// @route   GET /api/orders/restaurant/:restaurantId
// @access  Private (RestaurantOwner / Admin)
exports.getRestaurantOrders = async (req, res) => {
  try {
    // Ensure the user actually owns this restaurant
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    
    if (!restaurant) {
       return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.ownerName.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to view these orders' });
    }

    const orders = await Order.find({ restaurantId: req.params.restaurantId })
      .populate('userId', 'name email phone')
      .populate('items.menuItem', 'foodName image')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get orders for current owner's restaurant
// @route   GET /api/orders/owner/my-restaurant
// @access  Private (RestaurantOwner / Admin)
exports.getMyRestaurantOrders = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerName: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant profile not found' });
    }

    const orders = await Order.find({ restaurantId: restaurant._id })
      .populate('userId', 'name email phone')
      .populate('items.menuItem', 'foodName image')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      restaurantId: restaurant._id,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (System Admin / Delivery Rider view logic can be expanded here)
// @route   GET /api/orders
// @access  Private (Admin / DeliveryRider)
exports.getAllOrders = async (req, res) => {
  try {
    // If DeliveryRider, maybe we only want to show 'Preparing' or 'Out for Delivery' orders
    let query = {};
    if (req.user.role === 'deliveryRider') {
      query.orderStatus = { $in: ['preparing', 'delivering'] };
    }

    const orders = await Order.find(query)
      .populate('restaurantId', 'restaurantName address')
      .populate('userId', 'name phone')
      .sort('-createdAt');
      
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (RestaurantOwner / Admin / DeliveryRider)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Role-based logic check
    if (req.user.role === 'restaurantOwner') {
      const restaurant = await Restaurant.findById(order.restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant associated with this order no longer exists' });
      }

      if (restaurant.ownerName.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to update this order' });
      }
    }

    // If customer tries to update status, block (they can only cancel)
    if (req.user.role === 'customer') {
      return res.status(401).json({ message: 'Customers cannot manually progress delivery state' });
    }

    order.orderStatus = orderStatus;
    await order.save();

    // Auto-create a Delivery record when owner moves order to 'Out for Delivery'
    if (orderStatus === 'Out for Delivery' && order.orderType === 'Delivery') {
      const existingDelivery = await Delivery.findOne({ orderId: order._id });
      if (!existingDelivery) {
        await Delivery.create({
          orderId: order._id,
          deliveryAddress: order.deliveryAddress,
          deliveryStatus: 'Pending'
        });
      }
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customer)
exports.cancelOrder = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Ensure the customer cancelling is the owner of the order
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to cancel this order' });
    }

    // Business Logic: Can only cancel if pending
    if (order.orderStatus !== 'Pending') {
      return res.status(400).json({ message: `Cannot cancel order in ${order.orderStatus} state` });
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
