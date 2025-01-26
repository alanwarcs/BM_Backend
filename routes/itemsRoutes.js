// routes/itemsRoutes.js

const express = require('express');
const { addItem } = require('../controllers/ItemsController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes

const router = express.Router();

// Add Item Route
router.post('/addItem', authMiddleware, addItem);

module.exports = router;