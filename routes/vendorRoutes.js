const express = require('express');
const { addVendors } = require('../controllers/VendorController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes

const router = express.Router();

// Route for user signup
router.post('/addVendors', authMiddleware, addVendors);


module.exports = router;
