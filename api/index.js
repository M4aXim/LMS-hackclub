const path = require('path');
const fs = require('fs');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Read the api.html file
        const filePath = path.join(process.cwd(), 'public', 'api.html');
        const html = fs.readFileSync(filePath, 'utf8');
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error('API documentation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}