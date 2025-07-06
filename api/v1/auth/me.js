const connectDB = require('../../utils/database');
const { authenticateJWT } = require('../../../middleware/validation');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectDB();
        
        // Run JWT authentication
        await new Promise((resolve, reject) => {
            authenticateJWT(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Return user info
        res.json({ success: true, data: req.user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}