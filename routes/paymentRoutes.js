// routes/paymentRoutes.js
const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/PayementController');
const {authMiddleware} = require('../middlewares/authMiddleware');


const router = express.Router();

// Route to create a payment order
router.post('/create-order', authMiddleware, createOrder);

// Route to verify payment
router.post('/verify-payment', authMiddleware, verifyPayment);

module.exports = router;
