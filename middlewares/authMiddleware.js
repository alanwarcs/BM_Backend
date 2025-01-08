const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff'); // Staff model
const SubscriptionHistory = require('../models/SubscriptionHistory'); // SubscriptionHistory model

/**
 * Middleware to authenticate requests using JWT token stored in cookies.
 * Verifies the token, checks user status, and attaches user info to the request.
 */
exports.authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Token expired. Please sign in again.' });
                }
                return res.status(401).json({ message: 'Invalid token.' });
            }

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

            try {
                const subscriptions = await SubscriptionHistory.find({
                    businessId: user.businessId._id,
                }).sort({ endDate: -1 }); // Sort by endDate to get the latest subscriptions first

                if (subscriptions.length > 0) {
                    const currentDate = new Date();
                    const currentDateString = currentDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
                    let activeSubscriptionFound = false;

                    for (const subscription of subscriptions) {
                        if (subscription.subscriptionStatus === 'active') {
                            if (subscription.endDate < currentDate) {
                                // Expire the active subscription if its end date has passed
                                subscription.subscriptionStatus = 'expired';
                                await subscription.save();

                                user.businessId.isPaid = false;
                                await user.businessId.save();
                            } else {
                                activeSubscriptionFound = true;
                            }
                        } else if (
                            subscription.subscriptionStatus === 'upcoming' &&
                            subscription.startDate.toISOString().split('T')[0] === currentDateString &&
                            !activeSubscriptionFound
                        ) {
                            // Activate an upcoming subscription if its start date matches the current date
                            subscription.subscriptionStatus = 'active';
                            await subscription.save();

                            user.businessId.isPaid = true;
                            await user.businessId.save();

                            activeSubscriptionFound = true;
                        }
                    }
                }
            } catch (error) {
                console.error('Error in subscription handling:', error);
                return res.status(500).json({ message: 'Subscription details not found. Please contact support.' });
            }

            req.user = {
                id: user._id,
                name: user.name,
                email: user.email,
                photo: user.photo,
                businessId: user.businessId,
            };

            next();
        });
    } catch (error) {
        console.error('Error in authMiddleware:', error);
        return res.status(500).json({ message: 'Authentication failed.' });
    }
};
