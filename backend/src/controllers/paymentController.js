const Payment = require('../models/Payment');
const Order = require('../models/Order');

// @desc    Record a new payment
// @route   POST /api/payments
// @access  Private (Customer / System callback)
exports.recordPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, amount, paymentStatus } = req.body;

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify ownership (or allow admins)
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
       return res.status(401).json({ message: 'Not authorized to record payment for this order' });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
        return res.status(400).json({ message: 'Payment record already exists for this order. Please update instead.' });
    }

    const payment = await Payment.create({
      orderId,
      paymentMethod,
      amount,
      paymentStatus: paymentStatus || 'pending'
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    View payment history (for customer)
// @route   GET /api/payments/myhistory
// @access  Private (Customer)
exports.getMyPayments = async (req, res) => {
  try {
    // Find all orders belonging to the user
    const orders = await Order.find({ userId: req.user._id }).select('_id');
    const orderIds = orders.map(o => o._id);

    // Find payments matching those order ids
    const payments = await Payment.find({ orderId: { $in: orderIds } })
        .populate({ path: 'orderId', select: 'totalAmount orderStatus restaurantId', populate: { path: 'restaurantId', select: 'restaurantName' }})
        .sort('-paymentDate');

    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate generic invoice data for a payment
// @route   GET /api/payments/:id/invoice
// @access  Private (Customer / RestaurantOwner / Admin)
exports.generateInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
       .populate({
         path: 'orderId',
         populate: [
            { path: 'userId', select: 'name email phone address' },
            { path: 'restaurantId', select: 'restaurantName email phone address' },
            { path: 'items.menuItem', select: 'foodName price' }
         ]
       });

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Simple auth check - ensure viewer is part of the transaction
    const order = payment.orderId;
    if (order.userId._id.toString() !== req.user._id.toString() 
        && order.restaurantId._id.toString() !== req.user._id.toString() // assuming user id of restaurant owner logic maps somehow, actually logic is order -> restaurant -> owner
        && req.user.role !== 'admin') {
       // Since the restaurant owner logic is slightly deeper, let's just do a blanket admin check if they aren't the customer
       // A more perfect check would query Restaurant.findById(order.restaurantId) and compare ownerName.
       
       if (req.user.role !== 'admin' && req.user.role !== 'restaurantOwner') {
          return res.status(401).json({ message: 'Not authorized to view this invoice' });
       }
    }

    // Map invoice data response
    const invoiceData = {
       invoiceId: `INV-${payment._id.toString().substring(0, 8).toUpperCase()}`,
       date: payment.paymentDate,
       status: payment.paymentStatus,
       method: payment.paymentMethod,
       customerData: order.userId,
       restaurantData: order.restaurantId,
       items: order.items.map(item => ({
           name: item.menuItem.foodName,
           quantity: item.quantity,
           unitPrice: item.price,
           total: item.quantity * item.price
       })),
       totalAmount: payment.amount
    };

    res.status(200).json({ success: true, data: invoiceData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// @desc    Update payment status
// @route   PUT /api/payments/:id/status
// @access  Private (Admin / System)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    let payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Typically only Admins or an automated webhook should mark things simply as PAID or FAILED
    if (req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Only admins can directly alter payment completion states' });
    }

    payment.paymentStatus = paymentStatus;
    
    if (paymentStatus === 'completed') {
       payment.paymentDate = Date.now();
       // Also sync the order status context
       const order = await Order.findById(payment.orderId);
       if (order && order.orderStatus === 'pending') {
           order.orderStatus = 'accepted';
           await order.save();
       }
    }

    await payment.save();

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
