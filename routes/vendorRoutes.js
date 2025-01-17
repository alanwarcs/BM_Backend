const express = require('express');
const { addVendors, getVendors, getVendorDetails, updateVendor, deleteVendor } = require('../controllers/VendorController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes

const router = express.Router();

// Add Vendor Route
router.post('/addVendors', authMiddleware, addVendors);

// Get Vendors Route
router.get('/vendors', authMiddleware, getVendors);

// get Vendor details based on id Route
router.get('/getVendorDetails/:vendorId', authMiddleware, getVendorDetails);

// update Vendor Route
router.delete('/updateVendor/:vendorId', authMiddleware, updateVendor);

// Delete Vendor Route
router.delete('/vendors/:vendorId', authMiddleware, deleteVendor);


module.exports = router;
