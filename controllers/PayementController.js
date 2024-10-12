// controllers/paymentController.js
const Razorpay = require('razorpay');
const PaymentHistory = require('../models/PaymentHistory');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
exports.createOrder = async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create order', error });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  // If the payment is verified successfully, store the payment history
  const paymentData = {
    businessId: req.user.businessId, // Assuming you have the user info
    staffId: req.user.staffId, // Assuming you have the staff info
    paymentDate: new Date(),
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    status: 'success',
    amount: req.body.amount, // Ensure this amount is correct
  };

  try {
    // Store Payment History
    const paymentHistory = await PaymentHistory.create(paymentData);

    // Store Subscription History
    const subscriptionData = {
      businessId: paymentData.businessId,
      paymentId: paymentHistory._id,
      planId: req.body.planId, // Assuming planId is provided in the request
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Example: 30 days from now
      subscriptionStatus: 'active',
      orderId: razorpay_order_id,
    };

    await SubscriptionHistory.create(subscriptionData);

    res.status(200).json({ success: true, message: 'Payment verified successfully, redirecting to dashboard' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error storing payment data', error });
  }
};
