const Item = require('../models/Items');
const Vendor = require('../models/Vendor');
const Storage = require('../models/Storage');
const mongoose = require('mongoose');

exports.addItem = async (req, res) => {
    try {
        const user = req.user;

    
    if (!user || !user.businessId || !user.id) {
            return res.status(400).json({ success: false, message: 'Invalid user data.' });
        }

        const {
            itemName,
            itemType,
            storage = [],
            units = [],
            sellInfo,
            purchaseInfo,
            gst,
            taxPreference,
            sku,
            hsnOrSac
        } = req.body;

        if (!itemName || !itemType || !sellInfo || !purchaseInfo || purchaseInfo.purchasePrice == null) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        // Validate storage ObjectIds
        const invalidStorageIds = storage.filter(loc => loc.storage && !mongoose.Types.ObjectId.isValid(loc.storage));
        if (invalidStorageIds.length > 0) {
            return res.status(400).json({ success: false, message: 'One or more storage locations have invalid ObjectId(s).' });
        }

        // Validate vendorId if provided
        if (purchaseInfo.vendorId && !mongoose.Types.ObjectId.isValid(purchaseInfo.vendorId)) {
            return res.status(400).json({ success: false, message: 'Invalid vendorId.' });
        }

        const newItem = new Item({
            itemName,
            itemType,
            storage: storage.filter(loc => loc.storage), // Remove empty storage entries
            units: units.filter(unit => unit.category.trim() !== '' && unit.unit.trim() !== ''), // Filter out empty units
            sellInfo,
            purchaseInfo: {
                ...purchaseInfo,
                vendorId: purchaseInfo.vendorId || undefined // Set to undefined if empty
            },
            gst,
            taxPreference,
            sku,
            hsnOrSac,
            userId: user.id,
            businessId: user.businessId
        });

        await newItem.save();

        res.status(201).json({ success: true, message: 'Item added successfully.', item: newItem });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};