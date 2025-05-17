
const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes
const { getUserSummary } = require('../controllers/BusinessController');

const router = express.Router();

// Route for business address
router.get('/summary', authMiddleware, getUserSummary);

module.exports = router;