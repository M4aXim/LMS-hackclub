const express = require('express');
const router = express.Router();
const { submitLeaveRequest, getMyLeaveRequests, submitLeaveForApproval } = require('../controllers/leaveController');
const { leaveRequestValidation, authenticateJWT } = require('../middleware/validation');

// @route   POST /api/leave/request
// @desc    Submit a leave request
// @access  Private
router.post('/request', authenticateJWT, submitLeaveRequest);

// @route   GET /api/leave/my-requests
// @desc    Get user's leave requests
// @access  Private
router.get('/my-requests', authenticateJWT, getMyLeaveRequests);

// @route   POST /api/v1/:fullName/:date/:token
// @desc    Submit leave request for supervisor approval (open endpoint)
// @access  Public
router.post('/:fullName/:date/:token', submitLeaveForApproval);

module.exports = router; 