const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff'); // Assuming Staff model is used for user details

exports.authMiddleware = async (req, res, next) => {
    try {
        // Extract token from the cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        // Verify the JWT token with custom error handling
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ error: 'Token expired. Please sign in again.' });
                }
                return res.status(401).json({ error: 'Invalid token.' });
            }

            // Find the staff by decoded ID and attach it to the request
            const user = await Staff.findById(decoded.userId);
            if (!user) {
                return res.status(401).json({ error: 'Authentication failed. User not found.' });
            }

            req.user = user; // Attach user info to the request
            next(); // Pass control to the next handler
        });

    } catch (error) {
        console.error('Error in authMiddleware:', error);
        return res.status(500).json({ error: 'Authentication failed.' });
    }
};