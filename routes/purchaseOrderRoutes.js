const express = require('express');
const { generatePurchaseOrder, createPurchaseOrder, getPurchaseOrder, getPurchaseOrderDetails, viewAttachment, updatePurchaseOrder } = require('../controllers/PurchaseOrderController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const uploadFile = require("../middlewares/uploadFile");

const router = express.Router();

// Route to generate purchase order
router.get('/generate', authMiddleware, generatePurchaseOrder);

// Route to create purchase order
router.post('/create', 
    authMiddleware, 
    uploadFile("purchase-orders", "attachments"),
    createPurchaseOrder);

// Route to get purchase orders with pagination
router.get('/', authMiddleware, getPurchaseOrder);

// Route to get purchase order details by ID
router.get('/:purchaseOrderId', authMiddleware, getPurchaseOrderDetails);

// Route to view an attachment
router.get('/ViewAttachment/:purchaseOrderId/:attachmentId', authMiddleware, viewAttachment);

// Route to update purchase order details by ID
router.put('/:purchaseOrderId', 
    authMiddleware, 
    uploadFile("purchase-orders", "attachments"),
    updatePurchaseOrder);

module.exports = router;