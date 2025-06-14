const Staff = require('../models/Staff'); // Staff model
const Organization = require('../models/Organization'); // Organization model
const SubscriptionHistory = require('../models/SubscriptionHistory'); // SubscriptionHistory model
const bcrypt = require('bcrypt'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For generating JWT tokens
const crypto = require('crypto'); // For creating random tokens
const sendEmail = require('../utils/sendEmailUtils'); // Utility for sending emails
require('dotenv').config(); // For accessing environment variables

// Regex patterns for email and password validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Signup and generate verification token.
 * Creates an organization and an associated staff user.
 */
exports.signup = async (req, res) => {
    const { name, organizationName, email, phone, password, designation, termsAccepted } = req.body;

    // Validate required fields
    if (!name || !organizationName || !password || !email || !phone || !designation || !termsAccepted) {
        return res.status(400).json({ message: 'All fields are required, and you must accept the terms.' });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Validate password complexity
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'Password must include uppercase, lowercase, numbers, and symbols, and be at least 8 characters long.'
        });
    }

    const normalizedEmail = email.toLowerCase(); // Normalize email to lowercase

    try {
        // Check if organization already exists
        let organization = await Organization.findOne({ email: normalizedEmail });
        if (organization) {
            return res.status(400).json({ message: 'You are already registered.' });
        }

        // Check if staff already exists
        let staff = await Staff.findOne({ email: normalizedEmail });
        if (staff) {
            return res.status(400).json({ message: 'You are already associated with an organization.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        const verificationToken = crypto.randomBytes(32).toString('hex'); // Generate verification token
        const verificationTokenExpires = Date.now() + 86400000; // Token expiry (1 day)

        // Create a new organization
        organization = new Organization({
            name: organizationName,
            email,
            phone,
            termsAccepted
        });
        await organization.save();

        // Create a new staff user linked to the organization
        staff = new Staff({
            businessId: organization._id,
            name,
            email: normalizedEmail,
            phone,
            designation,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpires
        });
        await staff.save();

        // Generate JWT token for authentication
        const token = jwt.sign({ userId: staff._id, email: staff.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Set the JWT as an HTTPOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });

        // Send email verification link
        const verificationURL = `http://yourdomain.com/verify-email/${verificationToken}`;
        await sendEmail({
            to: normalizedEmail,
            subject: 'Email Verification',
            templatePath: '../templates/verification_email.html',
            templateData: { name, verificationURL }
        });

        res.status(201).json({ message: 'Registration successful! Please check your email for verification.' });
    } catch (error) {
        res.status(500).json({ message: 'Signup failed, please try again.', error: error.message });
    }
};

/**
 * Signin method for authenticating users.
 * Verifies email and password, then generates a JWT token.
 */
exports.signin = async (req, res) => {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    try {
        const user = await Staff.findOne({ email }); // Find user by email
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Set JWT as an HTTPOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({ message: 'Signin successful!' });
    } catch (error) {
        res.status(500).json({ message: 'Signin failed, please try again.', error: error.message });
    }
};

/**
 * Account setup before subscription and payment.
 * Updates organization and staff details after user inputs.
 */
exports.setupAccount = async (req, res) => {
    try {
        const { address, country, state, pin, isGst, gstin, timeZone, dateFormat, currency, theme } = req.body;

        if (!req.user) {
            return res.status(401).json({ message: 'Authentication failed.' });
        }

        const userId = req.user.id;

        // Validate required fields
        if (!address || !country || !state || !pin || !timeZone || !dateFormat || !currency) {
            return res.status(400).json({ message: 'All fields must be provided.' });
        }
        if (isGst && !gstin) {
            return res.status(400).json({ message: 'GSTIN is required if GST is registered.' });
        }

        const staff = await Staff.findOne({ _id: userId }).populate('businessId'); // Find staff user
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        const organization = await Organization.findOne({ _id: staff.businessId }); // Find organization
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found.' });
        }

        // Update organization details
        Object.assign(organization, {
            address,
            country,
            region: state,
            pincode: pin,
            isGSTRegistered: isGst,
            GSTIN: gstin,
            preferences: { timeZone, dateFormat, currency },
            isSetupCompleted: true
        });
        await organization.save();

        // Update staff preferences
        staff.preferences.theme = theme || staff.preferences.theme;
        await staff.save();

        res.status(200).json({ message: 'Account setup completed successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};

/**
 * Validates the user's authentication token.
 * Returns user and organization details if valid.
 */
exports.validateUser = async (req, res) => {
    try {
        if (req.user) {
            const { id, name, email, photo, businessId } = req.user;

            // Fetch the latest active subscription
            const activeSubscription = await SubscriptionHistory.findOne({
                businessId: businessId._id,
                subscriptionStatus: 'active',
            }).sort({ endDate: -1 });

            // Update business status based on the subscription
            const isPaid = !!activeSubscription;
            const subscriptionStatus = activeSubscription ? activeSubscription.subscriptionStatus : 'inactive';

            // Return updated user details
            return res.status(200).json({
                message: 'Token is valid.',
                user: {
                    id: id,
                    name,
                    email,
                    photo,
                    organization: {
                        businessId: businessId._id,
                        name: businessId.name,
                        logo: businessId.logo,
                        isSetupCompleted: businessId.isSetupCompleted,
                        isPaid,
                        subscriptionStatus,
                        activeSubscriptionId: activeSubscription ? activeSubscription._id : null,
                    },
                },
            });
            
        } else {
            return res.status(401).json({ message: 'Authentication failed.' });
        }
    } catch (error) {
        console.error('Error in validateUser:', error);
        res.status(500).json({ message: 'Unable to validate token.', error: error.message });
    }
};

/**
 * Logs out the user by clearing the JWT cookie.
 */
exports.signout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });
    res.status(200).json({ message: 'Logout successful!' });
};