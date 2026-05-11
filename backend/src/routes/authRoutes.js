const express = require('express');
const { registerUser, loginUser, getUserProfile, getAllUsers, changePassword, forgotPassword, resetPassword, deleteUser } = require('../controllers/authController');
const { protect, isAdmin } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, isAdmin, getAllUsers);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
