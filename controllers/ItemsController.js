const Item = require('../models/Items');
const Vendor = require('../models/Vendor');
const Storage = require('../models/Storage');
const mongoose = require('mongoose');
const fs = require("fs");
const path = require("path");

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


/**
 * Get item List.
 * Get item details by User, ensuring it belongs to the user's organization.
 */
exports.getItemList = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.businessId) {
      return res.status(400).json({ success: false, message: "Invalid user data." });
    }

    // Fetch all necessary fields
    const items = await Item.find(
      { businessId: user.businessId },
      { _id: 1, itemName: 1, itemType: 1, purchaseInfo: 1, gst: 1, units: 1 }
    );

    res.status(200).json({
      success: true,
      data: items.map((item) => ({
        id: item._id,
        itemName: item.itemName,
        itemType: item.itemType,
        rate: item.purchaseInfo?.purchasePrice || 0, // Default to 0 if missing
        taxPreference: item.taxPreference || "GST Exclusive", // Default value
        intraStateGST: item.gst?.intraStateGST || 0, // Default to 0 if missing
        interStateGST: item.gst?.interStateGST || 0, // Default to 0 if missing
        unit: item.units?.[0]?.unit || "nos", // Default to "nos" if units is empty or missing
      })),
    });
  } catch (error) {
    console.error("Error in getItemList:", error); // Log the error for debugging
    res.status(500).json({ success: false, message: "Failed to retrieve items. Please try again later." });
  }
};

/**
 * Get item Details.
 * Get item details by its ID, ensuring it belongs to the user's organization.
 */
exports.getItemDetails = async (req, res) => {
    try {
        const user = req.user;

        // Validate user object
        if (!user || !user.businessId || !user.id) {
            return res.status(400).json({ success: false, message: 'Invalid user data.' });
        }

        const { itemId } = req.params;

        // Ensure itemId is provided
        if (!itemId) {
            return res.status(400).json({ success: false, message: 'Item ID is required.' });
        }

        // Find the item to ensure it exists and belongs to the user's organization
        const item = await Item.findOne({ _id: itemId, businessId: user.businessId });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found or unauthorized access.' });
        }

        // Return the item details
        res.status(200).json({
            success: true,
            itemDetails: item,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching item details.',
            error: error.message, // Return only the error message for better security
        });
    }
};

/**
 * Update Item.
 * Updates a Item's details by its ID, ensuring it belongs to the user's organization.
 */
exports.updateItem = async (req, res) => {
    try {
        const user = req.user;

        if (!user || !user.businessId || !user.id) {
            return res.status(400).json({ success: false, message: 'Invalid user data.' });
        }

        const { itemId } = req.params;
        let updateData = req.body;

        if (!itemId) {
            return res.status(400).json({ success: false, message: 'Item ID is required.' });
        }

        const item = await Item.findOne({ _id: itemId, businessId: user.businessId });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found or unauthorized access.' });
        }

        const { itemName, itemType, sellInfo, purchaseInfo } = updateData;

        if (!itemName || !itemType || !sellInfo || !purchaseInfo || purchaseInfo.purchasePrice == null) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        // Validate storage ObjectIds
        const invalidStorageIds = updateData.storage?.filter(loc => loc.storage && !mongoose.Types.ObjectId.isValid(loc.storage)) || [];
        if (invalidStorageIds.length > 0) {
            return res.status(400).json({ success: false, message: 'One or more storage locations have invalid ObjectId(s).' });
        }

        // Check if all storage locations exist in the database
        const storageIds = updateData.storage?.map(loc => loc.storage).filter(id => id) || []; // Remove empty storage IDs
        if (storageIds.length > 0) {
            const existingStorageCount = await Storage.countDocuments({ _id: { $in: storageIds } });

            if (existingStorageCount !== storageIds.length) {
                return res.status(404).json({ success: false, message: 'One or more storage locations not found.' });
            }
        }

        Object.assign(item, updateData);
        await item.save();

        res.status(200).json({
            success: true,
            message: 'Item updated successfully.',
            updatedItem: item,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the Item.',
            error: error.message,
        });
    }
};

/**
 * Delete Items.
 * Deletes a Items by its ID, ensuring it belongs to the user's organization.
 */
exports.deleteItems = async (req, res) => {
    try {
        const user = req.user;

        // Ensure the user and their businessId are valid
        if (!user || !user.businessId || !user.id) {
            return res.status(400).json({ success: false, message: 'Invalid user data.' });
        }

        const { itemsId } = req.params;

        // Ensure itemsId is provided
        if (!itemsId) {
            return res.status(400).json({ success: false, message: 'Items ID is required.' });
        }

        // Find the items to ensure it exists and belongs to the user's organization
        const items = await Item.findOne({ _id: itemsId, businessId: user.businessId });

        if (!items) {
            return res.status(404).json({ success: false, message: 'Items not found or unauthorized access.' });
        }

        // Delete the Items
        await items.deleteOne({ _id: itemsId });

        res.status(200).json({
            success: true,
            message: 'Items deleted successfully.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the Items.',
            error: error.message,
        });
    }
};

/**
 * Print Item List.
 */
exports.printItemList = async (req, res) => {
    try {
        const { selectedItems } = req.body;

        if (!selectedItems || Object.keys(selectedItems).length === 0) {
            return res.status(400).send("Selected items or fields are missing.");
        }

        const itemIds = Object.keys(selectedItems);
        const items = await Item.find({ _id: { $in: itemIds } });

        const fieldMapping = {
            "Item Name": "itemName",
            "Item Type": "itemType",
            "SAC/HSN": "hsnOrSac",
            "SKU": "sku",
            "Sell Price": "sellInfo.price",
            "Purchase Price": "purchaseInfo.purchasePrice",
            "Tax Preference": "taxPreference",
            "Available Stock": "storage", // Sum of storage quantities
            "Stock Value": "stockValue",
            "Intra-State GST": "gst.intraStateGST",
            "Inter-State GST": "gst.interStateGST"
        };

        const templatePath = path.join(__dirname, "..", "templates", "itemsList.html");
        const templateHTML = fs.readFileSync(templatePath, "utf-8");

        const generateHTML = (items) => {
            return templateHTML
                .replace(
                    "{{HEADERS}}",
                    Object.keys(fieldMapping).map((field) => `<th>${field}</th>`).join("")
                )
                .replace(
                    "{{ROWS}}",
                    items.map(item =>
                        `<tr>${Object.keys(fieldMapping)
                            .map((field) => {
                                let value;

                                switch (field) {
                                    case "Sell Price":
                                        value = item.sellInfo?.price ? `₹${item.sellInfo.price}` : "-";
                                        break;
                                    case "Purchase Price":
                                        value = item.purchaseInfo?.purchasePrice ? `₹${item.purchaseInfo.purchasePrice}` : "-";
                                        break;
                                    case "Intra-State GST":
                                        value = item.gst?.intraStateGST ? `${item.gst.intraStateGST}%` : "0%";
                                        break;
                                    case "Inter-State GST":
                                        value = item.gst?.interStateGST ? `${item.gst.interStateGST}%` : "0%";
                                        break;
                                    case "Available Stock":
                                        value = item.storage?.reduce((sum, storage) => sum + (storage.quantity || 0), 0) || 0;
                                        break;
                                    default:
                                        value = fieldMapping[field].split('.').reduce((acc, key) => acc && acc[key], item) || "-";
                                }

                                return `<td>${value}</td>`;
                            })
                            .join("")}</tr>`
                    ).join("")
                );
        };

        const html = generateHTML(items);

        res.setHeader("Content-Type", "text/html");
        res.send(html);
    } catch (error) {
        console.error("Error generating item list:", error);
        res.status(500).send("Failed to generate item list");
    }
};