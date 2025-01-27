// routes/paymentRoutes.js
const express = require('express');
const { createOrder, verifyPayment, getOrderDetails } = require('../controllers/PayementController');
const {authMiddleware} = require('../middlewares/authMiddleware');


const router = express.Router();

// Route to create a payment order
router.post('/create-order', authMiddleware, createOrder);

// Route to verify payment
router.post('/verify-payment', authMiddleware, verifyPayment);

router.get('/order-details', authMiddleware, getOrderDetails);

module.exports = router;
