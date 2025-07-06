const connectDB = require('../../../../utils/database');
const { updateUserStatus } = require('../../../../../controllers/adminController');
const { authenticateJWT, requireGlobalAdmin } = require('../../../../../middleware/validation');
const { body, validationResult } = require('express-validator');

// Validation middleware
const statusUpdateValidation = [
    body('status')
        .isIn(['approved', 'rejected'])
        .withMessage('Status must be either "approved" or "rejected"')
        .notEmpty()
        .withMessage('Status is required'),
    body('reason')
        .optional()
        .isString()
        .withMessage('Reason must be a string')
        .isLength({ max: 500 })
        .withMessage('Reason must be less than 500 characters')
];

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectDB();
        
        // Set userId from query parameter
        req.params = { userId: req.query.userId };
        
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
        await Promise.all(statusUpdateValidation.map(validation => validation.run(req)));
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Call the controller
        await updateUserStatus(req, res);
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}