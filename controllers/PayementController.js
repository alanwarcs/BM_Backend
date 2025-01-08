const Razorpay = require('razorpay'); // Razorpay SDK for payment integration
const PaymentHistory = require('../models/PaymentHistory'); // Payment history model
const Organization = require('../models/Organization'); // Payment history model
const SubscriptionHistory = require('../models/SubscriptionHistory'); // Subscription history model
const Plan = require('../models/Plans'); // Plan model
const crypto = require('crypto'); // For signature verification
require('dotenv').config(); // For accessing environment variables

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create an order for a plan purchase.
 * Validates user details, fetches plan data, and creates a Razorpay order.
 */
exports.createOrder = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ message: 'Invalid user data.' });
    }

    const { planId } = req.body;

    // Check for existing order in cookie
    if (req.cookies.orderDetails) {
      const existingOrder = JSON.parse(req.cookies.orderDetails);
      if (existingOrder.planId === planId) {
        return res.status(200).json({ message: 'Order already exists for this plan.' });
      }
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found.' });
    }

    const amountInSmallestUnit = Math.round(parseFloat(plan.price.toString()) * 100);
    const orderOptions = {
      amount: amountInSmallestUnit,
      currency: plan.currency || 'INR',
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(orderOptions);

    const orderDetails = {
      orderId: order.id,
      amount: amountInSmallestUnit,
      currency: plan.currency || 'INR',
      planId: plan._id,
      planName: plan.planName,
      planValidity: plan.durationDays,
      total: plan.price,
    };

    res.cookie('orderDetails', JSON.stringify(orderDetails), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: 'Order created successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order.', error: error.message });
  }
};


/**
 * Verify payment and activate subscription.
 * Validates Razorpay signature and updates payment and subscription history.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentData, planId } = req.body;

    // Fetch necessary user data
    const user = req.user;

    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ message: 'Invalid user data.' });
    }

    const businessId = user.businessId;
    const staffId = user.id;

    // Validate payment
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment details.' });
    }

    // Fetch plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    // Check for any active subscriptions for the organization
    const lastActiveSubscription = await SubscriptionHistory.findOne({
      businessId,
      subscriptionStatus: 'active',
    }).sort({ endDate: -1 }); // Sort by end date to get the most recent subscription

    // Calculate start date
    const currentDate = new Date();
    const startDate = lastActiveSubscription && new Date(lastActiveSubscription.endDate) > currentDate
      ? new Date(lastActiveSubscription.endDate) // Start after the current active subscription ends
      : currentDate; // Start immediately if no active subscription

    // Calculate end date based on the plan's duration
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Determine subscription status
    const subscriptionStatus = startDate.toDateString() === currentDate.toDateString() ? 'active' : 'upcoming';

    // Store payment details in PaymentHistory
    const paymentHistory = new PaymentHistory({
      businessId,
      staffId,
      paymentDate: currentDate,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'success', // Mark payment as successful
      amount: plan.price,
    });
    await paymentHistory.save();

    // Store subscription details in SubscriptionHistory
    const subscriptionHistory = new SubscriptionHistory({
      businessId,
      paymentId: paymentHistory._id,
      planId,
      startDate,
      endDate,
      subscriptionStatus, // Use the calculated subscription status
      orderId: razorpay_order_id,
    });
    await subscriptionHistory.save();

    // Update the organization's isPaid field to true
    await Organization.findByIdAndUpdate(
      businessId,
      { isPaid: true },
      { new: true } // Return the updated document
    );

    // Clear the orderDetails cookie
    res.cookie('orderDetails', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Clear the cookie immediately
    });

    res.status(200).json({ success: true, message: 'Payment verified and subscription processed successfully.' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment.', error: error.message });
  }
};

/**
 * Get order details from cookies.
 */
exports.getOrderDetails = async (req, res) => {
  try {
    // Get user details from the authenticated request
    const user = req.user;
    if (!user || !user.businessId || !user.id) {
      return res
        .status(400)
        .json({ message: 'Invalid user data. Ensure businessId and staffId are provided.' });
    }

    // Read orderDetails from the cookie
    const orderDetails = req.cookies.orderDetails;

    if (!orderDetails) {
      return res.status(404).json({ message: 'No order details found.' });
    }

    // Parse and send back the orderDetails
    res.status(200).json({ orderDetails: JSON.parse(orderDetails) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve order details.', error: error.message });
  }
};
