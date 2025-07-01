const express = require('express');
const router = express.Router();
const { getPendingUsers, updateUserStatus, getAllUsers } = require('../controllers/adminController');
const { body } = require('express-validator');

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

// @route   GET /api/admin/pending-users
// @desc    Get all pending users
// @access  Private (Global Admin only)
router.get('/pending-users', getPendingUsers);

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Global Admin only)
router.get('/users', getAllUsers);

// @route   PUT /api/admin/users/:userId/status
// @desc    Approve or reject a user
// @access  Private (Global Admin only)
router.put('/users/:userId/status', statusUpdateValidation, updateUserStatus);

module.exports = router; 