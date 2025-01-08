const Plan = require('../models/Plans'); // Plans model

/**
 * Create New Plans .
 */
exports.createPlan = async (req, res) => {
  // Destructure the data from the request body
  const { planName, price, durationDays, features } = req.body;

  try {
    // Create a new Plan instance with the provided data
    const newPlan = new Plan({
      planName,
      price,
      durationDays,
      features,
    });

    // Save the new plan to the database
    await newPlan.save();

    // Send success response with the newly created plan
    res.status(201).json({
      success: true,
      plan: newPlan, // Returning the newly created plan data
    });
  } catch (error) {
    // Send error response if an error occurs during plan creation
    res.status(500).json({
      success: false,
      message: 'Error creating plan', // Error message
      error, // Include the error object for debugging
    });
  }
};


/**
 * Get All Plans.
 */
exports.getPlans = async (req, res) => {
  try {
    // Fetch all plans from the database
    const plans = await Plan.find();

    // Send success response with the plans data
    res.status(200).json({
      success: true,
      plans, // Returning the list of plans
    });
  } catch (error) {
    // Send error response if an error occurs while fetching plans
    res.status(500).json({
      success: false,
      message: 'Error fetching plans', // Error message
      error, // Include the error object for debugging
    });
  }
};