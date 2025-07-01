const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['student', 'teacher', 'director', 'global_admin'],
        default: 'student'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected', 'active'],
        default: 'pending'
    },
    // One-time access token for approval page
    approvalToken: {
        type: String,
        unique: true,
        sparse: true
    },
    tokenExpiresAt: {
        type: Date
    },
    // Role-based assignment fields
    assignedTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    classNumber: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'users'
});

// Generate approval token
userSchema.methods.generateApprovalToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.approvalToken = token;
    this.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return token;
};

// Clear approval token after use
userSchema.methods.clearApprovalToken = function() {
    this.approvalToken = undefined;
    this.tokenExpiresAt = undefined;
};

// Compare password with hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Custom validation for student-specific fields - only required when status is approved
userSchema.pre('save', function(next) {
    // Only validate assignedTeacher and classNumber for students who are approved
    if (this.role === 'student' && this.status === 'approved') {
        if (!this.assignedTeacher) {
            const error = new Error('assignedTeacher is required for approved students');
            error.name = 'ValidationError';
            return next(error);
        }
        if (!this.classNumber) {
            const error = new Error('classNumber is required for approved students');
            error.name = 'ValidationError';
            return next(error);
        }
    }
    next();
});

// Index for faster queries (removed email index since unique: true already creates it)
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ assignedTeacher: 1 });

module.exports = mongoose.model('User', userSchema, 'users'); 