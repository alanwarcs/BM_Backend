const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Get the token from the cookies (or alternatively from headers if required)
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        // If no token is provided, send an unauthorized error
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        // Verify the token using the JWT secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded token (user data) to the request object
        req.user = decoded;

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;
