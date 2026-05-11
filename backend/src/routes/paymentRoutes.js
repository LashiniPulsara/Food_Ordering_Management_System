const express = require('express');
const {
  recordPayment,
  getMyPayments,
  generateInvoice,
  updatePaymentStatus
} = require('../controllers/paymentController');

const { protect } = require('../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(protect, recordPayment);

router
  .route('/myhistory')
  .get(protect, getMyPayments);

router
  .route('/:id/invoice')
  .get(protect, generateInvoice);

router
  .route('/:id/status')
  .put(protect, updatePaymentStatus); // Controller enforces 'admin' internally

module.exports = router;
