const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');

// Initialize dotenv to load environment variables
dotenv.config();

// Create an Express application
const app = express();

// Middleware
app.use(express.json());       // To parse JSON request bodies
app.use(cookieParser());       // To parse cookies
app.use(cors());               // Enable CORS for all routes

app.get('/', (req, res) => {
    res.send('Hello, Express with MongoDB!');
});

// Environment variable for PORT or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});