const express = require('express');
const router = express.Router();
const { submitLeaveRequest, getMyLeaveRequests, submitLeaveForApproval, approveLeaveRequest, getLeaveRequestDetails } = require('../controllers/leaveController');
const { leaveRequestValidation, authenticateJWT } = require('../middleware/validation');

// @route   POST /api/leave/request
// @desc    Submit a leave request
// @access  Private
router.post('/request', authenticateJWT, submitLeaveRequest);

// @route   GET /api/leave/my-requests
// @desc    Get user's leave requests
// @access  Private
router.get('/my-requests', authenticateJWT, getMyLeaveRequests);

// @route   GET /api/v1/:fullName/:date/:token
// @desc    Submit leave request for supervisor approval (open endpoint)
// @access  Public
router.get('/:fullName/:date/:token', submitLeaveForApproval);

// @route   GET /api/v1/leave/details/:token
// @desc    Get leave request details by token
// @access  Public
router.get('/details/:token', getLeaveRequestDetails);

// @route   POST /api/v1/approve/:token
// @desc    Approve or reject leave request by supervisor
// @access  Public
router.post('/approve/:token', approveLeaveRequest);

module.exports = router; 