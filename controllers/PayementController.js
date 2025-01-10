const Razorpay = require('razorpay'); // Razorpay SDK for payment integration
const PaymentHistory = require('../models/PaymentHistory'); // Payment history model
const Organization = require('../models/Organization'); // Payment history model
const SubscriptionHistory = require('../models/SubscriptionHistory'); // Subscription history model
const Plan = require('../models/Plans'); // Plan model
const sendEmail = require('../utils/sendEmailUtils'); // Utility for sending emails
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

    // Fetch user data
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
      return res.status(404).json({
        success: false,
        message: 'The selected plan does not exist. Please try again.',
      });
    }

    // Check for active subscriptions and calculate dates
    const lastActiveSubscription = await SubscriptionHistory.findOne({
      businessId,
      subscriptionStatus: 'active',
    }).sort({ endDate: -1 });

    const currentDate = new Date();
    const startDate = lastActiveSubscription && new Date(lastActiveSubscription.endDate) > currentDate
      ? new Date(lastActiveSubscription.endDate)
      : currentDate;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscriptionStatus = startDate.toDateString() === currentDate.toDateString() ? 'active' : 'upcoming';

    // Format dates to dd-mm-yyyy
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    // Save payment history
    const paymentHistory = new PaymentHistory({
      businessId,
      staffId,
      paymentDate: currentDate,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: 'success',
      amount: plan.price,
    });
    await paymentHistory.save();

    // Save subscription history
    const subscriptionHistory = new SubscriptionHistory({
      businessId,
      paymentId: paymentHistory._id,
      planId,
      startDate,
      endDate,
      subscriptionStatus,
      orderId: razorpay_order_id,
    });
    await subscriptionHistory.save();

    // Update organization
    await Organization.findByIdAndUpdate(
      businessId,
      { isPaid: true },
      { new: true }
    );

    const planPrice = parseFloat(plan.price);

    // Prepare email data
    const emailData = {
      name: user.name || 'Customer',
      orderId: razorpay_order_id,
      planName: plan.planName,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      currencySymbol: plan.currencySymbol || '₹',
      price: planPrice,
      total: planPrice,
    };

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Subscription Confirmation',
      templatePath: '../templates/subscription_invoice.html', // Adjust the path to your email template
      templateData: emailData,
    });

    // Clear orderDetails cookie
    res.cookie('orderDetails', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    res.status(200).json({ success: true, message: 'Payment verified and subscription processed successfully. Confirmation email sent.' });
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
