const User = require('../models/User');
const { validationResult } = require('express-validator');
const { notifyUser } = require('../utils/emailService');

// @desc    Get all pending users (for Global Admin)
// @route   GET /api/admin/pending-users
// @access  Private (Global Admin only)
const getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await User.find({ status: 'pending' })
            .select('-__v')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: pendingUsers.length,
            data: pendingUsers
        });

    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching pending users',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Approve or reject a user (Global Admin)
// @route   PUT /api/admin/users/:userId/status
// @access  Private (Global Admin only)
const updateUserStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const { status, reason, assignedTeacher, assignedDirector, classNumber } = req.body;

        // Validate status
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "approved" or "rejected"'
            });
        }

        // Find and update user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'User is not in pending status'
            });
        }

        user.status = status;
        user.updatedAt = new Date();
        // Assign teacher/director/class if provided and status is approved
        if (status === 'approved') {
            if (user.role === 'student') {
                if (assignedTeacher) user.assignedTeacher = assignedTeacher;
                if (classNumber) user.classNumber = classNumber;
            }
            if (user.role === 'teacher') {
                if (assignedDirector) user.assignedDirector = assignedDirector;
            }
        }
        // Clear approval token after use (one-time use)
        user.clearApprovalToken();
        await user.save();

        // Notify user
        await notifyUser(user, status, reason);

        res.json({
            success: true,
            message: `User ${status} successfully`,
            data: {
                id: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating user status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get all users (for Global Admin)
// @route   GET /api/admin/users
// @access  Private (Global Admin only)
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, role } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (role) query.role = role;

        const users = await User.find(query)
            .select('-__v')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                usersPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getPendingUsers,
    updateUserStatus,
    getAllUsers
}; 