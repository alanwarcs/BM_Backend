// routes/planRoutes.js
const express = require('express');
const { createPlan, getPlans } = require('../controllers/PlansController');
const router = express.Router();

// Route to create a new plan
router.post('/create', createPlan);

// Route to get all plans
router.get('/', getPlans);

module.exports = router;
