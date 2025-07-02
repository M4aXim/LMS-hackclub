const User = require('../models/User');
const { validationResult } = require('express-validator');
const { notifyUser } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailService');

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

// @desc    Register user with role assignment (Global Admin)
// @route   POST /api/admin/register-user
// @access  Private (Global Admin only)
const registerUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { 
            email, 
            password, 
            fullName, 
            role, 
            teacherEmail, 
            classNumber 
        } = req.body;

        // Validate role
        if (!['student', 'teacher', 'director'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be student, teacher, or director'
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

        // Role-specific validations
        if (role === 'student') {
            if (!teacherEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Teacher email is required for students'
                });
            }
            if (!classNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Class number is required for students'
                });
            }

            // Find teacher by email
            const teacher = await User.findOne({ 
                email: teacherEmail.toLowerCase(),
                role: 'teacher',
                status: 'approved'
            });
            
            if (!teacher) {
                return res.status(400).json({
                    success: false,
                    message: 'Teacher not found or not approved'
                });
            }
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user object
        const userData = {
            email: email.toLowerCase(),
            password: hashedPassword,
            fullName,
            role,
            status: 'approved', // Directly approved by global admin
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Add role-specific fields
        if (role === 'student') {
            // Find teacher by email
            const teacher = await User.findOne({ 
                email: teacherEmail.toLowerCase(),
                role: 'teacher',
                status: 'approved'
            });
            
            userData.assignedTeacher = teacher._id;
            userData.classNumber = classNumber;
        } else if (role === 'teacher') {
            // Find director automatically
            const director = await User.findOne({ 
                role: 'director',
                status: 'approved'
            });
            
            if (director) {
                userData.assignedDirector = director._id;
            }
        }
        // For director role, no additional fields needed

        // Create and save user
        const newUser = new User(userData);
        await newUser.save();

        // Send welcome email with populated references
        const populatedUser = await User.findById(newUser._id)
            .populate('assignedTeacher', 'email fullName')
            .populate('assignedDirector', 'email fullName');
        
        await sendEmail(populatedUser.email, 'adminRegisteredUser', populatedUser);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: newUser._id,
                email: newUser.email,
                fullName: newUser.fullName,
                role: newUser.role,
                status: newUser.status,
                assignedTeacher: newUser.assignedTeacher,
                assignedDirector: newUser.assignedDirector,
                classNumber: newUser.classNumber,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while registering user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get available teachers for assignment
// @route   GET /api/admin/teachers
// @access  Private (Global Admin only)
const getAvailableTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ 
            role: 'teacher',
            status: 'approved'
        })
        .select('_id email fullName')
        .sort({ fullName: 1 });

        res.json({
            success: true,
            data: teachers
        });

    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching teachers',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get available directors for assignment
// @route   GET /api/admin/directors
// @access  Private (Global Admin only)
const getAvailableDirectors = async (req, res) => {
    try {
        const directors = await User.find({ 
            role: 'director',
            status: 'approved'
        })
        .select('_id email fullName')
        .sort({ fullName: 1 });

        res.json({
            success: true,
            data: directors
        });

    } catch (error) {
        console.error('Error fetching directors:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching directors',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getPendingUsers,
    updateUserStatus,
    getAllUsers,
    registerUser,
    getAvailableTeachers,
    getAvailableDirectors
}; 