// routes/purchaseOrderRoutes.js
const express = require('express');
const { generatePurchaseOrder, createPurchaseOrder } = require('../controllers/PurchaseOrderController');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Assuming you have an auth middleware to protect routes  

const router = express.Router();
// Route to generate purchase order
router.get('/generate', authMiddleware, generatePurchaseOrder);

router.post('/create', authMiddleware, createPurchaseOrder);

module.exports = router;