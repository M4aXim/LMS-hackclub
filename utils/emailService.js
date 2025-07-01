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