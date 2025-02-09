const Item = require('../models/Items');
const Vendor = require('../models/Vendor');
const Storage = require('../models/Storage');
const mongoose = require('mongoose');

/**
 * add new Items to DataBase
 */
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
            hsnOrSac,
            stockValue,
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

        // Check if the vendor exists in the database
        if (purchaseInfo.vendorId) {
            const vendorExists = await Vendor.findById(purchaseInfo.vendorId);
            if (!vendorExists) {
                return res.status(404).json({ success: false, message: 'Vendor not found.' });
            }
        }

        // Check if all storage locations exist in the database
        const storageIds = storage.map(loc => loc.storage).filter(id => id); // Remove empty storage IDs
        if (storageIds.length > 0) {
            const existingStorageCount = await Storage.countDocuments({ _id: { $in: storageIds } });

            if (existingStorageCount !== storageIds.length) {
                return res.status(404).json({ success: false, message: 'One or more storage locations not found.' });
            }
        }

        // Create new item
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
            stockValue,
            userId: user.id,
            businessId: user.businessId
        });

        await newItem.save();

        res.status(201).json({ success: true, message: 'Item added successfully.', item: newItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

/**
 * Get Items with filters and pagination
 */
exports.getItem = async (req, res) => {
    const user = req.user;

    if (!user || !user.businessId) {
        return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    const { 
        page = 1, 
        limit = 13, 
        search, 
        itemType, 
        minValue, 
        maxValue, 
        taxPreference 
    } = req.query
    
    const query = { businessId: user.businessId };

    if (itemType) {
        query.itemType = itemType;
    }

    if (search) {
        query.$or = [
            { itemName: { $regex: search, $options: 'i' } },
            { itemType: { $regex: search, $options: 'i' } },
        ];
    }

    if (minValue || maxValue) {
        query.stockValue = {};
        if (minValue) query.stockValue.$gte = parseInt(minValue, 10);
        if (maxValue) query.stockValue.$lte = parseInt(maxValue, 10);
    }

    if (taxPreference) {
        query.taxPreference = taxPreference;
    }

    try {
        const maxStockValue = await Item.findOne(query).sort({ stockValue: -1 }).select('stockValue');

        const totalItems = await Item.countDocuments(query);
        const items = await Item.find(query)
            .skip((parseInt(page, 10) - 1) * (parseInt(limit, 10) || 13))
            .limit(parseInt(limit, 10) || 13);

        res.status(200).json({
            success: true,
            message: 'Items retrieved successfully.',
            data: {
                items,
                maxStockValue: maxStockValue ? maxStockValue.stockValue : 100,
                pagination: {
                    totalPages: Math.ceil(totalItems / (parseInt(limit, 10) || 13)),
                    currentPage: parseInt(page, 10),
                }
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve items. Please try again later.' });
    }
};
