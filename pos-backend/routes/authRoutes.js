const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.post('/logout', protect, logout);

module.exports = router;
