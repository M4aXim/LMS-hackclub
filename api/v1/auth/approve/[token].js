const connectDB = require('../../../utils/database');
const { getUserByApprovalToken } = require('../../../../controllers/authController');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectDB();
        
        // Set token from query parameter
        req.params = { token: req.query.token };
        
        // Call the controller
        await getUserByApprovalToken(req, res);
    } catch (error) {
        console.error('Approval token error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}