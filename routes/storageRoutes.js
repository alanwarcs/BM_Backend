// routes/authRoutes.js

const express = require('express');
const { addStorage, getStorage, getStorageList, deleteStorage, updateStorage } = require('../controllers/StorageController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes

const router = express.Router();

// Route for get storages
router.get('/', authMiddleware, getStorage);

// Route for get storages
router.get('/getList', authMiddleware, getStorageList);

// Route for add new storage location
router.post('/addstorage', authMiddleware, addStorage);

// Delete storage Route
router.delete('/deleteStorage/:storageId', authMiddleware, deleteStorage);

// Update storage Route
router.put('/updateStorage/:storageId', authMiddleware, updateStorage);

module.exports = router;