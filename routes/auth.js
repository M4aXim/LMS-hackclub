const express = require('express');
const router = express.Router();
const { registerUser, getUserByApprovalToken, loginUser, getCurrentUser } = require('../controllers/authController');
const { registerValidation, loginValidation, authenticateJWT } = require('../middleware/validation');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, loginUser);

// @route   GET /api/auth/approve/:token
// @desc    Get user by approval token
// @access  Public
router.get('/approve/:token', getUserByApprovalToken);

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authenticateJWT, (req, res) => {
    res.json({ success: true, data: req.user });
});

module.exports = router; 