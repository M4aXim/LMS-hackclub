const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Connect to MongoDB with specific database name
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'LMS' // Specify the database name
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        console.log(`Users Collection: ${conn.connection.name}.users`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB; 