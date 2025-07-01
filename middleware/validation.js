const { body } = require('express-validator');

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

module.exports = {
    registerValidation,
    loginValidation
}; 