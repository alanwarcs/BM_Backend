const express = require('express');
const { addVendors, getVendors, getVendorList, getVendorDetails, updateVendor, deleteVendor, printVendorList } = require('../controllers/VendorController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes

const router = express.Router();

// Add Vendor Route
router.post('/addVendors', authMiddleware, addVendors);

// Get Vendors Route
router.get('/vendors', authMiddleware, getVendors);

// Get Vendor Names & IDs for Dropdowns
router.get('/vendors/list', authMiddleware, getVendorList);

// get Vendor details based on id Route
router.get('/getVendorDetails/:vendorId', authMiddleware, getVendorDetails);

// update Vendor Route
router.put('/updateVendor/:vendorId', authMiddleware, updateVendor);

// Delete Vendor Route
router.delete('/vendors/:vendorId', authMiddleware, deleteVendor);

// Print Vendor Route
router.post('/printList', authMiddleware, printVendorList);


module.exports = router;
