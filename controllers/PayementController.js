// controllers/paymentController.js
const Razorpay = require('razorpay');
const PaymentHistory = require('../models/PaymentHistory');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const Plan = require('../models/Plans');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
exports.createOrder = async (req, res) => {
  try {
    // Get user details from the req.user cookie
    const user = req.user;

    if (!user.businessId || !user.id) {
      return res.status(400).json({ message: 'Invalid user data. Ensure businessId and staffId are provided.' });
    }

    // Extract planId from the request body
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required to create an order.' });
    }

    // Find the plan in the database
    const plan = await Plan.findById(planId); // Assuming Plan is your plan model
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Convert the Decimal128 value to a regular float
    const amountInFloat = parseFloat(plan.price.toString());  // Convert Decimal128 to float

    // Razorpay expects amount in the smallest unit (paise for INR), so multiply by 100
    const amountInSmallestUnit = Math.round(amountInFloat * 100);  // Make sure it's an integer

    const currency = plan.currency || 'INR'; // Default to INR if currency is not defined in the plan
    const receipt = `receipt_order_${Date.now()}`; // Unique receipt for each order

    // Create Razorpay order
    const options = {
      amount: Math.round(amountInSmallestUnit), // Ensure it's an integer
      currency: currency,
      receipt: receipt,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);

    // Save order details in the PaymentHistory model
    const paymentHistory = new PaymentHistory({
      businessId: user.businessId._id,
      staffId: user.id, // Assuming staffId is the user ID
      orderId: order.id,
      amount: plan.price,
      status: 'Pending',
      paymentDate: Date.now(),
    });

    await paymentHistory.save();

    // Respond with Razorpay order details
    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: amountInSmallestUnit,
      currency: currency,
      key_id: razorpay.key_id, // Send Razorpay key_id to frontend for initialization
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    // Get payment data from frontend
    const { paymentId, orderId, signature } = req.body;

    // Get the Razorpay order details to verify signature
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    // Check if the signature matches
    if (expectedSignature === signature) {
      // Save payment details in PaymentHistory
      const paymentHistory = await PaymentHistory.findOne({ orderId: orderId });
      if (!paymentHistory) {
        return res.status(400).json({ success: false, message: 'Payment not found' });
      }

      paymentHistory.status = 'Success'; // Payment successful
      paymentHistory.paymentId = paymentId;
      await paymentHistory.save();

      // Create a subscription history entry
      const subscriptionHistory = new SubscriptionHistory({
        businessId: paymentHistory.businessId,
        paymentId: paymentHistory._id,
        planId: req.body.planId, // Assuming planId is provided in the request
        startDate: new Date(),
        endDate: new Date(Date.now() + req.body.duration * 24 * 60 * 60 * 1000), // Duration in days
        subscriptionStatus: 'Active',
        orderId: orderId,
      });

      await subscriptionHistory.save();

      res.status(200).json({ success: true, message: 'Payment verified and subscription active' });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};
