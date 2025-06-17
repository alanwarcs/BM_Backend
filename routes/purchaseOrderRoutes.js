// routes/purchaseOrderRoutes.js
const express = require('express');
const { generatePurchaseOrder, createPurchaseOrder, getPurchaseOrder } = require('../controllers/PurchaseOrderController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes  
const uploadFile = require("../middlewares/uploadFile");

const router = express.Router();
// Route to generate purchase order
router.get('/generate', authMiddleware, generatePurchaseOrder);

router.post('/create', 
    authMiddleware, 
    uploadFile("purchase-orders", "attachments"), // save to /uploads/purchase-orders
    createPurchaseOrder);

// get Item Route
router.get('/', authMiddleware, getPurchaseOrder);

module.exports = router;