// routes/itemsRoutes.js

const express = require('express');
const { addGstRate, getGstRates } = require('../controllers/GstController');


const router = express.Router();

// Add GST Route
router.post('/addGst', addGstRate);

// Get GST Route
router.get('/getGst', getGstRates);


module.exports = router;