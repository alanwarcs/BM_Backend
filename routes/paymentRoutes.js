// routes/paymentRoutes.js
const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const router = express.Router();

// Route to create a payment order
router.post('/create-order', createOrder);

// Route to verify payment
router.post('/verify-payment', verifyPayment);

module.exports = router;
