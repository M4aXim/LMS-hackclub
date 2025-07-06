const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const leaveRoutes = require('./routes/leave');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, images, etc.)
app.use(express.static(__dirname));

// Redirect /api to api.html
app.get('/api', (req, res) => {
    res.sendFile(path.join(__dirname, 'api.html'));
});

// API Routes (moved to /api/v1 to avoid conflict with redirect)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/leave', leaveRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve registration page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Serve approval page
app.get('/approve/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'approve.html'));
});

// Serve leave approval page
app.get('/approve-leave/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'approve-leave.html'));
});

// Serve test leave submission page
app.get('/test-leave', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-leave-submission.html'));
});

// Serve TOS.html
app.get('/tos', (req, res) => {
    res.sendFile(path.join(__dirname, 'TOS.html'));
});

// Serve privacy.html
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy.html'));
});

// API Health Check (moved to /api/v1)
app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        message: 'LMS API is running',
        timestamp: new Date().toISOString()
    });
});

// Test route to trigger 500 error (for testing purposes)
app.get('/test-500', (req, res, next) => {
    const error = new Error('Test 500 error');
    error.status = 500;
    next(error);
});

// Error handling middleware for 500-series errors
app.use((err, req, res, next) => {
    // Check if the error is a 500-series error
    if (err.status >= 500 && err.status < 600) {
        return res.status(err.status).sendFile(path.join(__dirname, 'error-500.html'));
    }
    
    // For other errors, pass to next middleware
    next(err);
});

// Global error handler for uncaught 500 errors
app.use((err, req, res, next) => {
    console.error('Uncaught error:', err.stack);
    res.status(500).sendFile(path.join(__dirname, 'error-500.html'));
});

// Handle 404 - serve index.html for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Don't exit the process, let the error middleware handle it
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, let the error middleware handle it
});

app.listen(PORT, () => {
    console.log(`🚀 LMS server is running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/v1/health`);
}); 