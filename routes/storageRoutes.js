// routes/authRoutes.js

const express = require('express');
const { addStorage, getStorage, deleteStorage } = require('../controllers/StorageController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes

const router = express.Router();

// Route for get storages
router.get('/', authMiddleware, getStorage);

// Route for add new storage location
router.post('/addstorage', authMiddleware, addStorage);

// Delete Vendor Route
router.delete('/deleteStorage/:storageId', authMiddleware, deleteStorage);

module.exports = router;