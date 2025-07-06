const connectDB = require('../../utils/database');
const { getMyLeaveRequests } = require('../../../controllers/leaveController');
const { authenticateJWT } = require('../../../middleware/validation');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
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
        await getMyLeaveRequests(req, res);
    } catch (error) {
        console.error('Get my leave requests error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}