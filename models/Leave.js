const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Made optional for pending approvals
    },
    fullName: {
        type: String,
        required: false // For pending approvals without user account
    },
    leaveType: {
        type: String,
        required: true,
        enum: ['sick', 'personal', 'emergency', 'vacation', 'other']
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    duration: {
        type: String,
        required: true,
        enum: ['half-day', 'full-day', 'multiple-days']
    },
    reason: {
        type: String,
        required: true,
        maxlength: 1000
    },
    additionalInfo: {
        type: String,
        maxlength: 500
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'pending_approval', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        maxlength: 500
    },
    // New fields for supervisor approval system
    approvalToken: {
        type: String,
        unique: true,
        sparse: true
    },
    approvalExpiry: {
        type: Date
    },
    supervisorEmail: {
        type: String,
        required: false
    },
    submittedDate: {
        type: Date,
        default: Date.now
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
    collection: 'leaves'
});

// Index for faster queries
leaveSchema.index({ userId: 1, status: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ createdAt: -1 });
leaveSchema.index({ approvalToken: 1 });
leaveSchema.index({ approvalExpiry: 1 });

module.exports = mongoose.model('Leave', leaveSchema, 'leaves'); 