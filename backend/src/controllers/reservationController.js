const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');

// @desc    Reserve a table
// @route   POST /api/reservations
// @access  Private (Customer)
exports.reserveTable = async (req, res) => {
  try {
    const {
      restaurantId, tableNumber, reservationDate, reservationTime,
      reservationEndTime, numberOfTables, guestCount,
      customerName, customerPhone, advancePayment
    } = req.body;

    const existingReservation = await Reservation.findOne({
      restaurantId,
      tableNumber,
      reservationDate,
      reservationTime,
      reservationStatus: { $ne: 'Cancelled' }
    });

    if (existingReservation) {
      return res.status(400).json({ message: 'This table is already booked for the selected date and time.' });
    }

    const reservation = await Reservation.create({
      userId: req.user._id,
      restaurantId,
      customerName,
      customerPhone,
      advancePayment,
      tableNumber,
      reservationDate,
      reservationTime,
      reservationEndTime: reservationEndTime || '',
      numberOfTables: numberOfTables || 1,
      guestCount
    });

    res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user reservations
// @route   GET /api/reservations/my-reservations
// @access  Private (Customer)
exports.getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user._id })
       .populate('restaurantId', 'restaurantName address phone');

    res.status(200).json({ success: true, count: reservations.length, data: reservations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reservations for a restaurant
// @route   GET /api/reservations/restaurant/:restaurantId
// @access  Private (RestaurantOwner / Admin)
exports.getRestaurantReservations = async (req, res) => {
   try {
     const restaurant = await Restaurant.findById(req.params.restaurantId);
     if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

     if (restaurant.ownerName.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
         return res.status(401).json({ message: 'Not authorized' });
     }

     const reservations = await Reservation.find({ restaurantId: req.params.restaurantId })
        .populate('userId', 'name email phone');

     res.status(200).json({ success: true, count: reservations.length, data: reservations });
   } catch(error) {
      res.status(500).json({ message: error.message });
   }
}

// @desc    Update reservation status
// @route   PUT /api/reservations/:id/status
// @access  Private (RestaurantOwner / Admin)
exports.updateReservationStatus = async (req, res) => {
  try {
    const { reservationStatus } = req.body;
    let reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (req.user.role === 'restaurantOwner') {
       const restaurant = await Restaurant.findById(reservation.restaurantId);
       if (restaurant.ownerName.toString() !== req.user._id.toString()) {
          return res.status(401).json({ message: 'Not authorized' });
       }
    }

    reservation.reservationStatus = reservationStatus;
    await reservation.save();

    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private (Customer)
exports.cancelReservation = async (req, res) => {
  try {
    let reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
       return res.status(401).json({ message: 'Not authorized to cancel this booking' });
    }

    reservation.reservationStatus = 'Cancelled';
    await reservation.save();

    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
