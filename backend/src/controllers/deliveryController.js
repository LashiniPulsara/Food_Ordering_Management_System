const Delivery = require('../models/Delivery');
const Order = require('../models/Order');

// @desc    Get all deliveries (For Admin/System) or My Deliveries (For Rider)
// @route   GET /api/deliveries
// @route   GET /api/deliveries/my-deliveries
// @access  Private
exports.getDeliveries = async (req, res) => {
  try {
    let query = {};
    // If route was hit as a rider checking personal deliveries
    if (req.route.path === '/my-deliveries') {
       query.riderId = req.user._id;
    }

    const deliveries = await Delivery.find(query).populate('orderId');
    res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create/Init a delivery record (usually done automatically post-checkout, or by admin)
// @route   POST /api/deliveries
// @access  Private (Admin / System)
exports.createDelivery = async (req, res) => {
   try {
     const { orderId, deliveryAddress } = req.body;
     
     const order = await Order.findById(orderId);
     if (!order) return res.status(404).json({ message: 'Order not found' });

     const delivery = await Delivery.create({
        orderId,
        deliveryAddress: deliveryAddress || order.deliveryAddress
     });

     res.status(201).json({ success: true, data: delivery });
   } catch(error) {
     res.status(500).json({ message: error.message });
   }
};

// @desc    Admin assigns a specific rider to a delivery
// @route   PUT /api/deliveries/:id/assign
// @access  Private (Admin)
exports.assignRider = async (req, res) => {
  try {
    const { riderId } = req.body;
    let delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery package not found' });
    }

    if (req.user.role !== 'admin') {
       return res.status(401).json({ message: 'Only admins can directly assign riders' });
    }

    delivery.riderId = riderId;
    delivery.deliveryStatus = 'Assigned';
    await delivery.save();

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rider self-assigns (claims) an available delivery
// @route   PUT /api/deliveries/:id/claim
// @access  Private (DeliveryRider)
exports.claimDelivery = async (req, res) => {
  try {
    let delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.deliveryStatus !== 'Pending') {
      return res.status(400).json({ message: 'This delivery has already been claimed by another rider' });
    }

    if (req.user.role !== 'deliveryRider') {
      return res.status(401).json({ message: 'Only delivery riders can claim deliveries' });
    }

    delivery.riderId = req.user._id;
    delivery.deliveryStatus = 'Assigned';
    await delivery.save();

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update delivery status
// @route   PUT /api/deliveries/:id/status
// @access  Private (DeliveryRider / Admin)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryStatus } = req.body;
    let delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery package not found' });
    }

    // Auth logic: Let admins do it, or let the assigned rider do it
    if (req.user.role !== 'admin' && delivery.riderId?.toString() !== req.user._id.toString()) {
       return res.status(401).json({ message: 'Not authorized to update this delivery tracking' });
    }

    delivery.deliveryStatus = deliveryStatus;
    await delivery.save();

    // When rider marks delivery as Completed, auto-update the linked Order to Delivered
    if (deliveryStatus === 'Completed' && delivery.orderId) {
      await Order.findByIdAndUpdate(delivery.orderId, { orderStatus: 'Delivered' });
    }

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Track single delivery
// @route   GET /api/deliveries/:id/track
// @access  Public / Private (Customer viewing their order)
exports.trackDelivery = async (req, res) => {
   try {
      const delivery = await Delivery.findById(req.params.id)
        .populate('riderId', 'name phone profileImage')
        .populate({ path: 'orderId', select: 'orderStatus' });

      if (!delivery) {
         return res.status(404).json({ message: 'Delivery tracking ID not found' });
      }

      res.status(200).json({ success: true, data: delivery });
   } catch(error) {
      res.status(500).json({ message: error.message });
   }
}
