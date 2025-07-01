const User = require('../models/User');
const { validationResult } = require('express-validator');
const { notifyGlobalAdmins } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';

function signToken(user) {
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { role, email, password, fullName } = req.body;

        // Validate password
        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Validate fullName
        if (!fullName || fullName.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Full Name is required.'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const user = new User({
            role,
            email: email.toLowerCase(),
            password: hashedPassword,
            fullName: fullName.trim(),
            status: 'pending',
            assignedTeacher: null,
            classNumber: null
        });

        // Generate approval token
        const approvalToken = user.generateApprovalToken();
        await user.save();

        // Notify global admins with approval link
        await notifyGlobalAdmins({ ...user.toObject(), approvalToken });

        const token = signToken(user);
        res.status(201).json({
            success: true,
            message: 'User registered successfully. Pending approval.',
            token,
            data: {
                id: user._id,
                role: user.role,
                email: user.email,
                status: user.status,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get user by approval token
// @route   GET /api/auth/approve/:token
// @access  Public
const getUserByApprovalToken = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ 
            approvalToken: token,
            tokenExpiresAt: { $gt: new Date() }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired approval token'
            });
        }

        res.json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                token: user.approvalToken
            }
        });

    } catch (error) {
        console.error('Error getting user by token:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is approved
        if (user.status !== 'approved') {
            return res.status(401).json({
                success: false,
                message: 'Account is not approved. Please wait for approval or contact administrator.'
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = signToken(user);
        res.json({
            success: true,
            message: 'Login successful',
            token,
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
    try {
        // This would typically use JWT middleware to get user from token
        // For now, we'll get user ID from request (you'll need to add JWT middleware)
        const userId = req.user?.id || req.headers['user-id'];
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const user = await User.findById(userId).select('-password -approvalToken -tokenExpiresAt');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    registerUser,
    getUserByApprovalToken,
    loginUser,
    getCurrentUser
}; 