const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';

// Validation rules for user registration
const registerValidation = [
    body('role')
        .isIn(['student', 'teacher'])
        .withMessage('Role must be either "student" or "teacher"')
        .notEmpty()
        .withMessage('Role is required'),
    
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .notEmpty()
        .withMessage('Email is required')
        .isLength({ max: 255 })
        .withMessage('Email must be less than 255 characters'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Validation rules for user login
const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .notEmpty()
        .withMessage('Email is required'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Validation for leave request
const leaveRequestValidation = [
    body('leaveType')
        .isIn(['sick', 'personal', 'emergency', 'vacation', 'other'])
        .withMessage('Invalid leave type'),
    body('startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    body('endDate')
        .isISO8601()
        .withMessage('End date must be a valid date'),
    body('duration')
        .isIn(['half-day', 'full-day', 'multiple-days'])
        .withMessage('Invalid duration type'),
    body('reason')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Reason must be between 10 and 1000 characters'),
    body('additionalInfo')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Additional info must be less than 500 characters')
];

function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

module.exports = {
    registerValidation,
    loginValidation,
    leaveRequestValidation,
    authenticateJWT
}; 