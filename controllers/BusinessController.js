const Staff = require('../models/Staff');
const Organization = require('../models/Organization');

exports.getUserAddress = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication failed.' });
        }

        const staff = await Staff.findById(req.user.id).populate('businessId');
        if (!staff || !staff.businessId) {
            return res.status(404).json({ message: 'Organization not found.' });
        }

        const org = staff.businessId;

        const address = {
            address: {
                address: org.address,
                region: org.region,
                country: org.country,
                pincode: org.pincode
            }
        };

        return res.status(200).json({ message: 'Address fetched successfully.', address });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch address.', error: error.message });
    }
};