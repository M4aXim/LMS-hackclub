const connectDB = require('../../utils/database');
const { loginUser } = require('../../../controllers/authController');
const { loginValidation } = require('../../../middleware/validation');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectDB();
        
        // Run validation
        await new Promise((resolve, reject) => {
            loginValidation(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Call the controller
        await loginUser(req, res);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}