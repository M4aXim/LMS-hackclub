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
// @route   GET /api/v1/:fullName/:date/:token
// @access  Public
const submitLeaveForApproval = async (req, res) => {
    try {
        const { fullName, date, token } = req.params;
        const { leaveType, startDate, endDate, duration, reason, additionalInfo, supervisorEmail } = req.query;

        // Validate required fields
        if (!leaveType || !startDate || !endDate || !duration || !reason || !supervisorEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required query parameters: leaveType, startDate, endDate, duration, reason, supervisorEmail'
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
        const approvalLink = `${process.env.BASE_URL || 'http://localhost:3000'}/approve-leave/${approvalToken}`;
        
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

// @desc    Approve or reject leave request by supervisor
// @route   GET /api/v1/approve/:token
// @access  Public
const approveLeaveRequest = async (req, res) => {
    try {
        const { token } = req.params;
        const { action, rejectionReason, supervisorName } = req.body;

        // Find leave request by approval token
        const leaveRequest = await Leave.findOne({ 
            approvalToken: token,
            status: 'pending_approval',
            approvalExpiry: { $gt: new Date() }
        });

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found or token expired'
            });
        }

        if (action === 'approve') {
            // Update leave request status to approved
            leaveRequest.status = 'approved';
            leaveRequest.approvedAt = new Date();
            leaveRequest.approvedBy = supervisorName || 'Supervisor';
            
            // Clear approval token and expiry
            leaveRequest.approvalToken = null;
            leaveRequest.approvalExpiry = null;

            await leaveRequest.save();

            // Send approval notification email to employee (if email is available)
            if (leaveRequest.supervisorEmail) {
                await sendEmail(leaveRequest.supervisorEmail, 'leaveApproved', {
                    fullName: leaveRequest.fullName,
                    leaveType: leaveRequest.leaveType,
                    startDate: leaveRequest.startDate.toLocaleDateString(),
                    endDate: leaveRequest.endDate.toLocaleDateString(),
                    approvedBy: supervisorName || 'Supervisor',
                    approvedAt: new Date().toLocaleString()
                });
            }

            res.json({
                success: true,
                message: 'Leave request approved successfully',
                data: {
                    id: leaveRequest._id,
                    fullName: leaveRequest.fullName,
                    status: leaveRequest.status,
                    approvedBy: leaveRequest.approvedBy,
                    approvedAt: leaveRequest.approvedAt
                }
            });

        } else if (action === 'reject') {
            // Update leave request status to rejected
            leaveRequest.status = 'rejected';
            leaveRequest.rejectionReason = rejectionReason || 'No reason provided';
            leaveRequest.approvedAt = new Date();
            leaveRequest.approvedBy = supervisorName || 'Supervisor';
            
            // Clear approval token and expiry
            leaveRequest.approvalToken = null;
            leaveRequest.approvalExpiry = null;

            await leaveRequest.save();

            // Send rejection notification email to employee (if email is available)
            if (leaveRequest.supervisorEmail) {
                await sendEmail(leaveRequest.supervisorEmail, 'leaveRejected', {
                    fullName: leaveRequest.fullName,
                    leaveType: leaveRequest.leaveType,
                    startDate: leaveRequest.startDate.toLocaleDateString(),
                    endDate: leaveRequest.endDate.toLocaleDateString(),
                    rejectedBy: supervisorName || 'Supervisor',
                    rejectedAt: new Date().toLocaleString(),
                    reason: rejectionReason || 'No reason provided'
                });
            }

            res.json({
                success: true,
                message: 'Leave request rejected successfully',
                data: {
                    id: leaveRequest._id,
                    fullName: leaveRequest.fullName,
                    status: leaveRequest.status,
                    rejectedBy: leaveRequest.approvedBy,
                    rejectedAt: leaveRequest.approvedAt,
                    rejectionReason: leaveRequest.rejectionReason
                }
            });

        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be "approve" or "reject"'
            });
        }

    } catch (error) {
        console.error('Error approving/rejecting leave request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing leave request',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get leave request details by token
// @route   GET /api/v1/leave/details/:token
// @access  Public
const getLeaveRequestDetails = async (req, res) => {
    try {
        const { token } = req.params;

        // Find leave request by approval token
        const leaveRequest = await Leave.findOne({ 
            approvalToken: token,
            status: 'pending_approval',
            approvalExpiry: { $gt: new Date() }
        });

        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found or token expired'
            });
        }

        res.json({
            success: true,
            data: leaveRequest
        });

    } catch (error) {
        console.error('Error fetching leave request details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching leave request details',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    submitLeaveRequest,
    getMyLeaveRequests,
    submitLeaveForApproval,
    approveLeaveRequest,
    getLeaveRequestDetails
}; 