const connectDB = require('../../utils/database');
const { submitLeaveRequest } = require('../../../controllers/leaveController');
const { authenticateJWT } = require('../../../middleware/validation');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectDB();
        
        // Run authentication
        await new Promise((resolve, reject) => {
            authenticateJWT(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Call the controller
        await submitLeaveRequest(req, res);
    } catch (error) {
        console.error('Submit leave request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}