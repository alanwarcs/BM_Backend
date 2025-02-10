// routes/itemsRoutes.js

const express = require('express');
const { addItem, getItem, deleteItems, printItemList } = require('../controllers/ItemsController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes

const router = express.Router();

// get Item Route
router.get('/', authMiddleware, getItem);

// Add Item Route
router.post('/addItem', authMiddleware, addItem);

// Delete Item Route
router.delete('/items/:itemsId', authMiddleware, deleteItems);

// Print Item Route
router.post('/printList', authMiddleware, printItemList);

module.exports = router;