const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (CSS, images, etc.)
app.use(express.static(__dirname));

// Serve index.html at the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve TOS.html
app.get('/tos', (req, res) => {
    res.sendFile(path.join(__dirname, 'TOS.html'));
});

// Handle 404 - serve index.html for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`LMS server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
}); 