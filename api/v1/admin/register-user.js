const connectDB = require('../../utils/database');
const { registerUser } = require('../../../controllers/adminController');
const { authenticateJWT, requireGlobalAdmin } = require('../../../middleware/validation');
const { body, validationResult } = require('express-validator');

// Validation middleware
const userRegistrationValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('fullName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    body('role')
        .isIn(['student', 'teacher', 'director'])
        .withMessage('Role must be student, teacher, or director'),
    body('teacherEmail')
        .if(body('role').equals('student'))
        .isEmail()
        .withMessage('Teacher email is required and must be valid for students')
        .normalizeEmail(),
    body('classNumber')
        .if(body('role').equals('student'))
        .notEmpty()
        .withMessage('Class number is required for students')
        .isLength({ max: 20 })
        .withMessage('Class number must be less than 20 characters')
];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectDB();
        
        // Run authentication and authorization
        await new Promise((resolve, reject) => {
            authenticateJWT(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            requireGlobalAdmin(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Run validation
        await Promise.all(userRegistrationValidation.map(validation => validation.run(req)));
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Call the controller
        await registerUser(req, res);
    } catch (error) {
        console.error('Admin register user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}