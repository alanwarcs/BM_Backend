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
        return res.status(400).json({ message: 'All fields are required, and you must accept the terms.' });
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
            return res.status(400).json({ message: 'You are already registered.' });
        }

        // Find Staff
        let staff = await Staff.findOne({ email: normalizedEmail });
        if (staff) {
            return res.status(400).json({ message: 'You are already associated with an organization and cannot create another one.' });
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
        // Set the JWT as an HTTPOnly cookie
        res.cookie('token', token, {
            httpOnly: true, // Prevent access to this cookie via JavaScript
            secure: process.env.NODE_ENV === 'production', // Ensure the cookie is sent over HTTPS in production
            maxAge: 24 * 60 * 60 * 1000 // 24 hours expiration
        });

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
        });

    } catch (error) {
        res.status(500).json({
            message: 'Signup failed, please try again.',
            message: error.message // Send the error message in the response
        });
    }
}

// Signin and Generate Tocken method
exports.signin = async (req, res) => {
    const { email, password } = req.body;

    //Email and Password Validatore
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
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
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set the JWT as an HTTPOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({ message: 'Signin successful!' });
    } catch (error) {
        res.status(500).json({
            message: 'Signin failed, please try again.',
            message: error.message // Send the error message in the response
        });
    }
}

//Setup Acoount Before Subsription and Payment
exports.setupAccount = async (req, res) => {
    try {
        const { address, country, state, pin, isGst, gstin, timeZone, dateFormat, currency, theme } = req.body;

        // Check if user info is available in the request (assuming req.user contains authenticated user details)
        if (!req.user) {
            return res.status(401).json({ message: 'User information is incomplete.' });
        }

        const userId = req.user._id;

        // Validate required fields
        if (!address || !country || !state || !pin || !timeZone || !dateFormat || !currency) {
            return res.status(400).json({ message: 'All required fields must be provided.' });
        }

        // Validate GSTIN if GST is selected
        if (isGst && !gstin) {
            return res.status(400).json({ message: 'GSTIN is required if GST is registered.' });
        }

        // Find the staff linked to the user
        const staff = await Staff.findOne({ _id: userId }).populate('businessId');
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        // Check if organization exists and update organization details
        const organization = await Organization.findOne({ _id: staff.businessId });
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found.' });
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
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.validateUser = async (req, res) => {
    try {
        if (req.user) {
            // Access populated user and organization details directly from req.user
            return res.status(200).json({
                message: 'Token is valid.',
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    photo: req.user.photo,
                    organization: {
                        businessId: req.user.businessId._id,
                        name: req.user.businessId.name,
                        logo: req.user.businessId.logo,
                        isSetupCompleted: req.user.businessId.isSetupCompleted,
                        isPaid: req.user.businessId.isPaid,
                    }
                }
            });
        } else {
            return res.status(401).json({ message: 'Authentication failed. User not found.' });
        }
    } catch (error) {
        console.error('Error in validateUser:', error);
        return res.status(500).json({ message: 'Unable to validate token.' });
    }
};



exports.signout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });
    res.status(200).json({ message: 'Logout successful!' });
};