const Storage = require('../models/Storage'); // Storage model
require('dotenv').config(); // For accessing environment variables

exports.addStorage = async (req, res) => {
    const user = req.user;

    // Validate user and businessId
    if (!user || !user.businessId) {
        return res.status(400).json({ success: false, message: 'Invalid user or business data.' });
    }

    const {
        storageType,
        storageName,
        storageAddress,
        capacity,
        capacityUnit,
    } = req.body;

    // Validate required fields
    if (!storageType || !storageName) {
        return res.status(400).json({ success: false, message: 'Storage type and name are required.' });
    }

    if (capacity && !capacityUnit) {
        return res.status(400).json({ success: false, message: 'Capacity unit is required if capacity is provided.' });
    }

    try {
        // Create new storage
        const newItem = new Storage({
            businessId: user.businessId,
            storageType,
            storageName,
            storageAddress,
            capacity,
            capacityUnit,
        });

        await newItem.save();

        res.status(201).json({ success: true, message: 'Storage added successfully.', data: newItem });
    } catch (error) {
        console.error('Error adding storage:', error); // Log the error for debugging
        res.status(500).json({ success: false, message: 'Failed to add storage. Please try again later.' });
    }
};

// Get all storage records with pagination and filtering
exports.getStorage = async (req, res) => {
    const user = req.user;

    if (!user || !user.businessId) {
        return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    const { page = 1, limit = 13, storageType, search } = req.query;
    const query = { businessId: user.businessId };

    if (storageType) {
        query.storageType = storageType;
    }

    if (search) {
        query.$or = [
            { storageName: { $regex: search, $options: 'i' } },
            { storageAddress: { $regex: search, $options: 'i' } },
        ];
    }

    try {
        const totalStorage = await Storage.countDocuments(query);
        const storages = await Storage.find(query)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.status(200).json({
            success: true,
            message: 'Storage retrieved successfully.',
            data: { storage: storages, pagination: { totalPages: Math.ceil(totalStorage / limit), currentPage: Number(page) } },
        });
    } catch (error) {
        console.error('Error fetching storage:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve storage. Please try again later.' });
    }
};