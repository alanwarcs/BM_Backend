// controllers/planController.js
const Plan = require('../models/Plans');

// Create a new plan
exports.createPlan = async (req, res) => {
  const { planName, price, durationDays, features } = req.body;

  try {
    const newPlan = new Plan({
      planName,
      price,
      durationDays,
      features,
    });

    await newPlan.save();
    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating plan', error });
  }
};

// Get all plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    res.status(200).json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching plans', error });
  }
};