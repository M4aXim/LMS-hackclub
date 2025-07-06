const connectDB = require('../../utils/database');
const { getPendingUsers } = require('../../../controllers/adminController');
const { authenticateJWT, requireGlobalAdmin } = require('../../../middleware/validation');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
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

        // Call the controller
        await getPendingUsers(req, res);
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}