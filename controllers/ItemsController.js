const Staff = require('../models/Staff'); // Staff model
const Organization = require('../models/Organization'); // Organization model
const SubscriptionHistory = require('../models/SubscriptionHistory'); // SubscriptionHistory model
const Vendor = require('../models/Vendor'); // Vendor model
const Item = require('../models/Items'); // Items model
require('dotenv').config(); // For accessing environment variables



/**
 * Add new item
 */
exports.addItem = async (req, res) => {
    const user = req.user;

    // Ensure the user and their businessId are valid
    if (!user || !user.businessId) {
        return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    const {
        itemName,
        itemType,
        locationId = [], // Default to empty array if no location is provided
        units,
        sellInfo,
        purchaseInfo,
        gst,
        taxPreference,
        sku,
        hsnOrSac,
        stockValue,
    } = req.body;

    // Map through locationId to filter out invalid or empty entries
    const validLocationId = locationId.map(locationEntry => {
        if (locationEntry.quantity && !locationEntry.location) {
            return { quantity: locationEntry.quantity }; // Save only quantity if location is empty
        }
        if (locationEntry.location && mongoose.Types.ObjectId.isValid(locationEntry.location)) {
            return locationEntry; // Save full entry if location is valid
        }
        return null; // Ignore invalid entries
    }).filter(entry => entry !== null); // Remove null entries

    try {
        // Only check for vendor existence if vendorId is provided
        if (purchaseInfo.vendorId) {
            const vendorExists = await Vendor.findById(purchaseInfo.vendorId);
            if (!vendorExists) {
                return res.status(404).json({ success: false, message: 'Vendor not found.' });
            }
        }

        // Create new item
        const newItem = new Item({
            businessId: user.businessId,
            itemName,
            itemType,
            locationId: validLocationId, // Only save valid locations or quantities
            units,
            sellInfo,
            purchaseInfo: {
                ...purchaseInfo,
                vendorId: purchaseInfo.vendorId || null, // Save null if no vendor is selected
            },
            gst,
            taxPreference,
            sku,
            hsnOrSac,
            stockValue,
        });

        await newItem.save();

        res.status(201).json({ success: true, message: 'Item added successfully.', data: newItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
};
