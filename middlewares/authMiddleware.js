const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff'); // Assuming Staff model is used for user details

exports.authMiddleware = async (req, res, next) => {
    try {
        // Extract token from headers or cookies (depending on your setup)
        const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        // Find the staff by decoded ID and attach it to the request
        const user = await Staff.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        req.user = user; // Attach user info to the request
        next(); // Pass control to the next handler

    } catch (error) {
        console.error('Error in authMiddleware:', error);
        return res.status(500).json({ error: 'Authentication failed.' });
    }
};
