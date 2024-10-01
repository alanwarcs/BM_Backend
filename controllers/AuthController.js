const Staff = require('../models/Staff');
const Organization = require('../models/Organization')
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For generating JWT tokens

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password complexity validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
            organization: organization._id,
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


    } catch (error) {
        res.status(500).json({
            message: 'Registration failed, please try again.',
            error: error.message // Send the error message in the response
        });
    }
}