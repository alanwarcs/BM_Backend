
const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes
const { getUserAddress } = require('../controllers/BusinessController');

const router = express.Router();

// Route for business address
router.get('/address', authMiddleware, getUserAddress);

module.exports = router;