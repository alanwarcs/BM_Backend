const express = require('express');
const { getTax, createTax } = require('../controllers/TaxController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes

const router = express.Router();

// Get Create Tax Route
router.post('/createTax', authMiddleware, createTax);

// Get All Tax Route
router.get('/getTax', authMiddleware, getTax);

module.exports = router;
