const connectDB = require('../../../../utils/database');
const { submitLeaveForApproval } = require('../../../../../controllers/leaveController');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectDB();
        
        // Set parameters from query
        req.params = {
            fullName: req.query.fullName,
            date: req.query.date,
            token: req.query.token
        };
        
        // Call the controller
        await submitLeaveForApproval(req, res);
    } catch (error) {
        console.error('Submit leave for approval error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}