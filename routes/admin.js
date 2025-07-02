const express = require('express');
const router = express.Router();
const { 
    getPendingUsers, 
    updateUserStatus, 
    getAllUsers, 
    registerUser, 
    getAvailableTeachers, 
    getAvailableDirectors 
} = require('../controllers/adminController');
const { body } = require('express-validator');
const { authenticateJWT, requireGlobalAdmin } = require('../middleware/validation');

// Validation for status update
const statusUpdateValidation = [
    body('status')
        .isIn(['approved', 'rejected'])
        .withMessage('Status must be either "approved" or "rejected"')
        .notEmpty()
        .withMessage('Status is required'),
    body('reason')
        .optional()
        .isString()
        .withMessage('Reason must be a string')
        .isLength({ max: 500 })
        .withMessage('Reason must be less than 500 characters')
];

// Validation for user registration
const userRegistrationValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('fullName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    body('role')
        .isIn(['student', 'teacher', 'director'])
        .withMessage('Role must be student, teacher, or director'),
    body('teacherEmail')
        .if(body('role').equals('student'))
        .isEmail()
        .withMessage('Teacher email is required and must be valid for students')
        .normalizeEmail(),
    body('classNumber')
        .if(body('role').equals('student'))
        .notEmpty()
        .withMessage('Class number is required for students')
        .isLength({ max: 20 })
        .withMessage('Class number must be less than 20 characters')
];

// @route   GET /api/admin/pending-users
// @desc    Get all pending users
// @access  Private (Global Admin only)
router.get('/pending-users', authenticateJWT, requireGlobalAdmin, getPendingUsers);

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Global Admin only)
router.get('/users', authenticateJWT, requireGlobalAdmin, getAllUsers);

// @route   GET /api/admin/teachers
// @desc    Get available teachers for assignment
// @access  Private (Global Admin only)
router.get('/teachers', authenticateJWT, requireGlobalAdmin, getAvailableTeachers);

// @route   GET /api/admin/directors
// @desc    Get available directors for assignment
// @access  Private (Global Admin only)
router.get('/directors', authenticateJWT, requireGlobalAdmin, getAvailableDirectors);

// @route   POST /api/admin/register-user
// @desc    Register user with role assignment
// @access  Private (Global Admin only)
router.post('/register-user', authenticateJWT, requireGlobalAdmin, userRegistrationValidation, registerUser);

// @route   PUT /api/admin/users/:userId/status
// @desc    Approve or reject a user
// @access  Private (Global Admin only)
router.put('/users/:userId/status', authenticateJWT, requireGlobalAdmin, statusUpdateValidation, updateUserStatus);

module.exports = router; 