const Staff = require('../models/Staff');
const Organization = require('../models/Organization')
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For generating JWT tokens
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendEmail = require('../utils/sendEmailUtils');
require('dotenv').config();

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password complexity validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Signup and Generate Tocken method
exports.signup = async (req, res) => {
    const { name, organizationName, email, phone, password, designation, termsAccepted } = req.body;

    // Required fields Validator
    if (!name || !organizationName || !password || !email || !phone || !designation || !termsAccepted) {
        return res.status(400).json({ error: 'All fields are required, and you must accept the terms.' });
    }

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long, and include uppercase letters, lowercase letters, numbers, and symbols.'
        });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    try {
        // Find Organization
        let organization = await Organization.findOne({ email: normalizedEmail });
        if (organization) {
            return res.status(400).json({ error: 'You are already registered.' });
        }

        // Find Staff
        let staff = await Staff.findOne({ email: normalizedEmail });
        if (staff) {
            return res.status(400).json({ error: 'You are already associated with an organization and cannot create another one.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token and expiry date
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = Date.now() + 86400000; // 1 day(24h)

        // Create Organization
        organization = new Organization({
            name: organizationName,
            email: email,
            phone: phone,
            termsAccepted: termsAccepted
        });
        await organization.save();

        // Create Staff
        staff = new Staff({
            businessId: organization._id,
            name: name,
            email: normalizedEmail,
            phone: phone,
            designation: designation,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpires
        });
        await staff.save();

        // Generate JWT token with staff._id
        const token = jwt.sign(
            { userId: staff._id, email: staff.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Generate verification URL
        const verificationURL = `http://yourdomain.com/verify-email/${verificationToken}`;

        // Send verification email using the HTML template
        await sendEmail({
            to: normalizedEmail,
            subject: 'Email Verification',
            templatePath: '../templates/verification_email.html',
            templateData: { name, verificationURL }
        });

        // Respond with success message and token
        res.status(201).json({
            message: 'Registration successful! Please check your email for verification.',
            token
        });

    } catch (error) {
        res.status(500).json({
            message: 'Signup failed, please try again.',
            error: error.message // Send the error message in the response
        });
    }
}

// Signin and Generate Tocken method
exports.signin = async (req, res) => {
    const { email, password } = req.body;

    //Email and Password Validatore
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long, and include uppercase letters, lowercase letters, numbers, and symbols.'
        });
    }
    try {
        // Find the user by email
        const user = await Staff.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ message: 'Signin successful!', token });
    } catch (error) {
        res.status(500).json({
            message: 'Signin failed, please try again.',
            error: error.message // Send the error message in the response
        });
    }
}

//Setup Acoount Before Subsription and Payment
exports.setupAccount = async (req, res) => {
    try {
        const { address, country, state, pin, isGst, gstin, timeZone, dateFormat, currency, theme } = req.body;

        // Check if user info is available in the request (assuming req.user contains authenticated user details)
        if (!req.user) {
            return res.status(401).json({ error: 'User information is incomplete.' });
        }

        const userId = req.user._id;

        // Validate required fields
        if (!address || !country || !state || !pin || !timeZone || !dateFormat || !currency) {
            return res.status(400).json({ error: 'All required fields must be provided.' });
        }

        // Validate GSTIN if GST is selected
        if (isGst && !gstin) {
            return res.status(400).json({ error: 'GSTIN is required if GST is registered.' });
        }

        // Find the staff linked to the user
        const staff = await Staff.findOne({ _id: userId }).populate('businessId');
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found.' });
        }

        // Check if organization exists and update organization details
        const organization = await Organization.findOne({ _id: staff.businessId });
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found.' });
        }

        // Update organization with validated data
        organization.address = address;
        organization.country = country;
        organization.region = state;
        organization.pincode = pin;
        organization.isGSTRegistered = isGst;
        organization.GSTIN = gstin;
        organization.preferences = {
            timeZone: timeZone,
            dateFormat: dateFormat,
            currency: currency
        };
        organization.isSetupCompleted = true; // Mark setup as complete

        // Save the updated organization
        await organization.save();

        // Update staff preferences (theme)
        staff.preferences.theme = theme || staff.preferences.theme;

        // Save the updated staff
        await staff.save();

        return res.status(200).json({
            message: 'Account setup completed successfully!',
            organization,
            staff
        });
    } catch (error) {
        console.error('Error in setupAccount:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};