const Staff = require('../models/Staff'); // Staff model
const Organization = require('../models/Organization'); // Organization model
const Tax = require('../models/Tax');//Tax Model

/**
 * Create tax route
 */
exports.createTax = async (req, res) => {
    try {
        const user = req.user;
        const { name, rateType, rate } = req.body;

        if (!user || !user.businessId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const tax = new Tax({
            name,
            rateType,
            rate,
            businessId: user.businessId
        });

        await tax.save();

        res.status(201).json({ message: 'Tax created successfully', tax });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create tax', error: error.message });
    }
};
/**
 *Get All Tax List 
*/
exports.getTax = async (req, res) => {
    try {
        const user = req.user

        if (!user || !user.businessId) {
            return res.status(400).json({ success: false, message: 'Invalid user data.' });
        }

        // Fetch only the necessary fields
        const taxes = await Tax.find({ businessId: user.businessId });

        res.status(200).json({success: true, taxes});
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching taxes names.',
            error: error.message,
        });
    }
}