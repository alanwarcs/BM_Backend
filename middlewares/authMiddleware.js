const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff'); // Assuming Staff model is used for user details

exports.authMiddleware = async (req, res, next) => {
    try {
        // Extract token from the cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // Verify the JWT token with custom error handling
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Token expired. Please sign in again.' });
                }
                return res.status(401).json({ message: 'Invalid token.' });
            }

            // Find the user and populate businessId fields
            const user = await Staff.findById(decoded.userId)
                .populate('businessId', 'name logo isBlocked isSetupCompleted isPaid');

            if (!user) {
                return res.status(401).json({ message: 'Authentication failed. User not found.' });
            }

            if (!user.isActive) {
                return res.status(401).json({ message: 'Your account is suspended by your Organization.' });
            }

            if (user.businessId.isBlocked) {
                return res.status(401).json({ message: 'Your organization account is suspended. Please contact support.' });
            }
            // Attach the user info to req, with isActive from the Staff model
            req.user = {
                id: user._id,
                name: user.name,
                email: user.email,
                photo: user.photo,
                businessId: user.businessId,
            };
            
            next(); // Pass control to the next handler
        });

    } catch (error) {
        console.error('Error in authMiddleware:', error);
        return res.status(500).json({ message: 'Authentication failed.' });
    }
};