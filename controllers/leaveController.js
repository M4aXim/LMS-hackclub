const Leave = require('../models/Leave');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

// @desc    Submit a leave request
// @route   POST /api/leave/request
// @access  Private
const submitLeaveRequest = async (req, res) => {
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

        // Get user ID from request (you'll need to add JWT middleware)
        const userId = req.user?.id || req.headers['user-id'];
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { leaveType, startDate, endDate, duration, reason, additionalInfo } = req.body;

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end < start) {
            return res.status(400).json({
                success: false,
                message: 'End date cannot be before start date'
            });
        }

        if (start < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            });
        }

        // Create new leave request
        const leaveRequest = new Leave({
            userId,
            leaveType,
            startDate: start,
            endDate: end,
            duration,
            reason,
            additionalInfo: additionalInfo || ''
        });

        await leaveRequest.save();

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            data: {
                id: leaveRequest._id,
                leaveType: leaveRequest.leaveType,
                startDate: leaveRequest.startDate,
                endDate: leaveRequest.endDate,
                status: leaveRequest.status,
                createdAt: leaveRequest.createdAt
            }
        });

    } catch (error) {
        console.error('Error submitting leave request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting leave request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get user's leave requests
// @route   GET /api/leave/my-requests
// @access  Private
const getMyLeaveRequests = async (req, res) => {
    try {
        // Get user ID from request (you'll need to add JWT middleware)
        const userId = req.user?.id || req.headers['user-id'];
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { page = 1, limit = 10, status } = req.query;
        
        const query = { userId };
        if (status) query.status = status;

        const leaveRequests = await Leave.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Leave.countDocuments(query);

        res.json({
            success: true,
            data: leaveRequests,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRequests: total,
                requestsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching leave requests',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Submit leave request for supervisor approval
// @route   POST /api/v1/:fullName/:date/:token
// @access  Public
const submitLeaveForApproval = async (req, res) => {
    try {
        const { fullName, date, token } = req.params;
        const { leaveType, startDate, endDate, duration, reason, additionalInfo, supervisorEmail } = req.body;

        // Validate required fields
        if (!leaveType || !startDate || !endDate || !duration || !reason || !supervisorEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: leaveType, startDate, endDate, duration, reason, supervisorEmail'
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end < start) {
            return res.status(400).json({
                success: false,
                message: 'End date cannot be before start date'
            });
        }

        if (start < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            });
        }

        // Generate approval token
        const approvalToken = crypto.randomBytes(32).toString('hex');
        const approvalExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create new leave request with approval token
        const leaveRequest = new Leave({
            userId: null, // Will be set when approved
            fullName: fullName,
            leaveType,
            startDate: start,
            endDate: end,
            duration,
            reason,
            additionalInfo: additionalInfo || '',
            status: 'pending_approval',
            approvalToken,
            approvalExpiry,
            supervisorEmail,
            submittedDate: new Date(date)
        });

        await leaveRequest.save();

        // Send email to supervisor
        const approvalLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/v1/approve/${approvalToken}`;
        
        const emailResult = await sendEmail(supervisorEmail, 'leaveApproval', {
            fullName,
            leaveType,
            startDate: start.toLocaleDateString(),
            endDate: end.toLocaleDateString(),
            duration,
            reason,
            additionalInfo: additionalInfo || 'None',
            approvalLink,
            requestId: leaveRequest._id
        });

        if (!emailResult.success) {
            console.error('Failed to send approval email:', emailResult.error);
        }

        res.status(201).json({
            success: true,
            message: 'Leave request submitted for supervisor approval',
            data: {
                id: leaveRequest._id,
                fullName: leaveRequest.fullName,
                leaveType: leaveRequest.leaveType,
                startDate: leaveRequest.startDate,
                endDate: leaveRequest.endDate,
                status: leaveRequest.status,
                submittedDate: leaveRequest.submittedDate,
                approvalToken: leaveRequest.approvalToken
            }
        });

    } catch (error) {
        console.error('Error submitting leave request for approval:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting leave request for approval',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    submitLeaveRequest,
    getMyLeaveRequests,
    submitLeaveForApproval
}; 