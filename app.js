const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const planRoutes = require('./routes/planRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const itemsRoutes = require('./routes/itemsRoutes');
const storageRoutes = require('./routes/storageRoutes');
const businessRoutes = require('./routes/businessRoutes')

// Initialize dotenv to load environment variables
dotenv.config();

// Create an Express application
const app = express();

// Middleware
app.use(express.json());       // To parse JSON request bodies
app.use(cookieParser());       // To parse cookies
app.use(cors());               // Enable CORS for all routes

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Root route
app.get('/', (req, res) => {
    res.send('Hello, Express with MongoDB!');
});

app.use('/api/auth', authRoutes);

app.use('/api/payment', paymentRoutes);

app.use('/api/plans', planRoutes);

app.use('/api/vendor', vendorRoutes);

app.use('/api/item', itemsRoutes);

app.use('/api/storage', storageRoutes);

app.use('/api/business', businessRoutes);

// Environment variable for PORT or default to 3000
const PORT = process.env.PORT || 3001;

// Start the server
app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
