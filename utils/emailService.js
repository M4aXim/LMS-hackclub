const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter connection
transporter.verify(function(error, success) {
    if (error) {
        console.error('Email service error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Email templates
const emailTemplates = {
    userRegistration: (userData) => ({
        subject: 'New User Registration - LMS System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">New User Registration</h2>
                <p>A new user has registered in the LMS system and requires approval.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">User Details:</h3>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Role:</strong> ${userData.role}</p>
                    <p><strong>Registration Date:</strong> ${new Date(userData.createdAt).toLocaleString()}</p>
                </div>
                
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0;">Approval Link:</h3>
                    <p>Click the link below to review and approve/reject this user:</p>
                    <a href="${process.env.BASE_URL || 'http://localhost:3000'}/approve/${userData.approvalToken}" 
                       style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                        Review & Approve User
                    </a>
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">
                        This link is valid for 24 hours and can only be used once.
                    </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from the LMS system.
                    </p>
                </div>
            </div>
        `
    }),
    
    userApproved: (userData) => ({
        subject: 'Account Approved - LMS System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">Account Approved!</h2>
                <p>Your account has been approved and is now active in the LMS system.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0;">Account Details:</h3>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Role:</strong> ${userData.role}</p>
                    ${userData.assignedTeacher ? `<p><strong>Assigned Teacher:</strong> ${userData.assignedTeacher.email}</p>` : ''}
                    ${userData.assignedDirector ? `<p><strong>Assigned Director:</strong> ${userData.assignedDirector.email}</p>` : ''}
                    ${userData.classNumber ? `<p><strong>Class Number:</strong> ${userData.classNumber}</p>` : ''}
                </div>
                
                <p>You can now log in to the LMS system and start using your account.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from the LMS system.
                    </p>
                </div>
            </div>
        `
    }),
    
    userRejected: (userData, reason) => ({
        subject: 'Account Registration Rejected - LMS System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc3545;">Registration Rejected</h2>
                <p>Unfortunately, your account registration has been rejected.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                    <h3 style="margin-top: 0;">Account Details:</h3>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Role:</strong> ${userData.role}</p>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                </div>
                
                <p>If you believe this was an error, please contact the system administrator.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from the LMS system.
                    </p>
                </div>
            </div>
        `
    }),

    adminRegisteredUser: (userData) => ({
        subject: 'Account Created - LMS System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">Account Created Successfully!</h2>
                <p>Your account has been created by the system administrator and is now active.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0;">Account Details:</h3>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Full Name:</strong> ${userData.fullName}</p>
                    <p><strong>Role:</strong> ${userData.role}</p>
                    ${userData.assignedTeacher ? `<p><strong>Assigned Teacher:</strong> ${userData.assignedTeacher.email}</p>` : ''}
                    ${userData.assignedDirector ? `<p><strong>Assigned Director:</strong> ${userData.assignedDirector.email}</p>` : ''}
                    ${userData.classNumber ? `<p><strong>Class Number:</strong> ${userData.classNumber}</p>` : ''}
                    <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Active</span></p>
                </div>
                
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0;">Next Steps:</h3>
                    <p>You can now log in to the LMS system using your email and the password provided by the administrator.</p>
                    <p>If you haven't received your password, please contact the system administrator.</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from the LMS system.
                    </p>
                </div>
            </div>
        `
    }),

    leaveApproval: (leaveData) => ({
        subject: `Leave Request Approval Required - ${leaveData.fullName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Leave Request Approval Required</h2>
                <p>A new leave request has been submitted and requires your approval.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Employee Details:</h3>
                    <p><strong>Name:</strong> ${leaveData.fullName}</p>
                    <p><strong>Request ID:</strong> ${leaveData.requestId}</p>
                    <p><strong>Submitted Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Leave Request Details:</h3>
                    <p><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
                    <p><strong>Start Date:</strong> ${leaveData.startDate}</p>
                    <p><strong>End Date:</strong> ${leaveData.endDate}</p>
                    <p><strong>Duration:</strong> ${leaveData.duration}</p>
                    <p><strong>Reason:</strong> ${leaveData.reason}</p>
                    ${leaveData.additionalInfo !== 'None' ? `<p><strong>Additional Info:</strong> ${leaveData.additionalInfo}</p>` : ''}
                </div>
                
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0;">Approval Action Required:</h3>
                    <p>Click the link below to review and approve/reject this leave request:</p>
                    <a href="${leaveData.approvalLink}" 
                       style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                        Review & Approve Leave Request
                    </a>
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">
                        This link is valid for 7 days and can only be used once.
                    </p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from the Leave Management System.
                    </p>
                </div>
            </div>
        `
    }),

    leaveApproved: (leaveData) => ({
        subject: `Leave Request Approved - ${leaveData.fullName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">Leave Request Approved!</h2>
                <p>Your leave request has been approved by your supervisor.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Leave Request Details:</h3>
                    <p><strong>Name:</strong> ${leaveData.fullName}</p>
                    <p><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
                    <p><strong>Start Date:</strong> ${leaveData.startDate}</p>
                    <p><strong>End Date:</strong> ${leaveData.endDate}</p>
                    <p><strong>Approved By:</strong> ${leaveData.approvedBy}</p>
                    <p><strong>Approved At:</strong> ${leaveData.approvedAt}</p>
                </div>
                
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0;">Status: Approved</h3>
                    <p>Your leave request has been approved and is now active.</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from the Leave Management System.
                    </p>
                </div>
            </div>
        `
    }),

    leaveRejected: (leaveData) => ({
        subject: `Leave Request Rejected - ${leaveData.fullName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc3545;">Leave Request Rejected</h2>
                <p>Unfortunately, your leave request has been rejected by your supervisor.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Leave Request Details:</h3>
                    <p><strong>Name:</strong> ${leaveData.fullName}</p>
                    <p><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
                    <p><strong>Start Date:</strong> ${leaveData.startDate}</p>
                    <p><strong>End Date:</strong> ${leaveData.endDate}</p>
                    <p><strong>Rejected By:</strong> ${leaveData.rejectedBy}</p>
                    <p><strong>Rejected At:</strong> ${leaveData.rejectedAt}</p>
                    <p><strong>Reason:</strong> ${leaveData.reason}</p>
                </div>
                
                <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                    <h3 style="margin-top: 0;">Status: Rejected</h3>
                    <p>Your leave request has been rejected. Please contact your supervisor for more information.</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from the Leave Management System.
                    </p>
                </div>
            </div>
        `
    })
};

// Send email function
const sendEmail = async (to, template, data) => {
    try {
        const emailContent = emailTemplates[template](data);
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Send notification to global admins about new registration
const notifyGlobalAdmins = async (userData) => {
    try {
        // Get all global admins
        const User = require('../models/User');
        const globalAdmins = await User.find({ 
            role: 'global_admin', 
            status: 'approved' 
        }).select('email');

        if (globalAdmins.length === 0) {
            console.log('No global admins found to notify');
            return { success: false, error: 'No global admins found' };
        }

        const adminEmails = globalAdmins.map(admin => admin.email);
        const result = await sendEmail(adminEmails.join(', '), 'userRegistration', userData);
        
        return result;
    } catch (error) {
        console.error('Error notifying global admins:', error);
        return { success: false, error: error.message };
    }
};

// Send approval/rejection email to user
const notifyUser = async (userData, action, reason = null) => {
    try {
        const template = action === 'approved' ? 'userApproved' : 'userRejected';
        const result = await sendEmail(userData.email, template, { ...userData, reason });
        
        return result;
    } catch (error) {
        console.error('Error notifying user:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendEmail,
    notifyGlobalAdmins,
    notifyUser,
    emailTemplates
}; 