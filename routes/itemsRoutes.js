// routes/itemsRoutes.js

const express = require('express');
const { addItem, getItem } = require('../controllers/ItemsController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes

const router = express.Router();

// get Item Route
router.get('/', authMiddleware, getItem);

// Add Item Route
router.post('/addItem', authMiddleware, addItem);

module.exports = router;