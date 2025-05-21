// routes/itemsRoutes.js

const express = require('express');
const { addItem, getItem, getItemList, deleteItems, printItemList, getItemDetails, updateItem } = require('../controllers/ItemsController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes

const router = express.Router();

// get Item Route
router.get('/', authMiddleware, getItem);

// get Item List Route
router.get('/getItemList', authMiddleware, getItemList)

// Add Item Route
router.post('/addItem', authMiddleware, addItem);

// Delete Item Route
router.delete('/items/:itemsId', authMiddleware, deleteItems);

// get item details based on id Route
router.get('/getItemDetails/:itemId', authMiddleware, getItemDetails);

// update Item Route
router.put('/updateItem/:itemId', authMiddleware, updateItem);

// Print Item Route
router.post('/printList', authMiddleware, printItemList);

module.exports = router;