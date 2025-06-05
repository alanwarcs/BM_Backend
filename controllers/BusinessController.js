const Staff = require('../models/Staff');
const Organization = require('../models/Organization');

exports.getUserSummary = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication failed: User not authenticated.' });
        }

        const staff = await Staff.findById(req.user.id).populate('businessId');
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }
        if (!staff.businessId) {
            return res.status(404).json({ message: 'Organization not found for this staff member.' });
        }

        const org = staff.businessId;

        const summary = {
            gstin: org.GSTIN,
            pan: org.pan,
            address: {
                address: org.address,
                region: org.region,
                country: org.country,
                pincode: org.pincode
            },
            organizationName: org.name || '',// Optional: Include additional fields if needed
            email: org.email || '',
            phone: org.phone || ''
        };

        return res.status(200).json({ message: 'Address fetched successfully.', summary });
    } catch (error) {
        console.error('Error fetching user summary:', error); // Log for debugging
        return res.status(500).json({ message: 'Failed to fetch address.', error: error.message });
    }
};