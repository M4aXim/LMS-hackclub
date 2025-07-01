const express = require('express');
const router = express.Router();
const { registerUser, getUserByApprovalToken, loginUser } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');

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

module.exports = router; 