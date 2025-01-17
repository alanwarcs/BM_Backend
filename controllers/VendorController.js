const Vendor = require('../models/Vendor'); // Vendor model
const Organization = require('../models/Organization'); // Organization model
require('dotenv').config(); // For accessing environment variables

/**
 * Add Vendors.
 * Creates a Vendor and links it to an organization.
 */
exports.addVendors = async (req, res) => {
  try {
    const user = req.user;

    // Ensure the user and their businessId are valid
    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    const {
      vendorOrganizationName,
      primaryPerson,
      displayName,
      emailAddress,
      phone,
      shippingAddress,
      billingAddress,
      taxDetails,
      bankDetails,
      currency,
      tags,
      notes,
      customFields,
    } = req.body;

    // Validate required fields
    if (!displayName) {
      return res.status(400).json({ success: false, message: 'Display Name is required.' });
    }

    // Check if the organization exists
    const organization = await Organization.findById(user.businessId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    // Create a new vendor
    const newVendor = new Vendor({
      businessId: user.businessId, // Link the vendor to the organization
      vendorOrganizationName,
      primaryPerson,
      displayName,
      emailAddress,
      phone,
      shippingAddress,
      billingAddress,
      taxDetails,
      bankDetails,
      currency,
      tags,
      notes,
      customFields,
    });

    // Save the vendor to the database
    await newVendor.save();

    res.status(201).json({
      success: true,
      message: 'Vendor added successfully.',
      vendor: newVendor,
    });
  } catch (error) {
    console.error('Error adding vendor:', error.message);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding the vendor.',
      error: error.message,
    });
  }
};

/**
 * Get all Vendors.
 */
exports.getVendors = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    const { page = 1, limit = 10 } = req.query; // Get page and limit from query params
    const vendors = await Vendor.find({ businessId: user.businessId })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalVendors = await Vendor.countDocuments({ businessId: user.businessId });
    const totalPages = Math.ceil(totalVendors / limit);

    res.status(200).json({
      success: true,
      vendors,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalVendors,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Vendors',
      error,
    });
  }
};

/**
 * Delete Vendor.
 * Deletes a Vendor by its ID, ensuring it belongs to the user's organization.
 */
exports.deleteVendor = async (req, res) => {
  try {
    const user = req.user;

    // Ensure the user and their businessId are valid
    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    const { vendorId } = req.params;

    // Ensure vendorId is provided
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID is required.' });
    }

    // Find the vendor to ensure it exists and belongs to the user's organization
    const vendor = await Vendor.findOne({ _id: vendorId, businessId: user.businessId });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found or unauthorized access.' });
    }

    // Delete the vendor
    await Vendor.deleteOne({ _id: vendorId });

    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting vendor:', error.message);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the vendor.',
      error: error.message,
    });
  }
};

/**
 * Get Vendor Details.
 * Get Vendor details by its ID, ensuring it belongs to the user's organization.
 */
exports.getVendorDetails = async (req, res) => {
  try {
    const user = req.user;

    // Validate user object
    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    const { vendorId } = req.params;

    // Ensure vendorId is provided
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID is required.' });
    }

    // Find the vendor to ensure it exists and belongs to the user's organization
    const vendor = await Vendor.findOne({ _id: vendorId, businessId: user.businessId });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found or unauthorized access.' });
    }

    // Return the vendor details
    res.status(200).json({
      success: true,
      vendorDetails: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor details.',
      error: error.message, // Return only the error message for better security
    });
  }
};

/**
 * Update Vendor.
 * Updates a Vendor's details by its ID, ensuring it belongs to the user's organization.
 */
exports.updateVendor = async (req, res) => {
  try {
    const user = req.user;

    // Validate user object
    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    const { vendorId } = req.params; // Vendor ID from request params
    const updateData = req.body; // Data to update from the request body

    // Ensure vendorId is provided
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID is required.' });
    }

    // Check if the vendor exists and belongs to the user's organization
    const vendor = await Vendor.findOne({ _id: vendorId, businessId: user.businessId });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found or unauthorized access.' });
    }

    // Update the vendor's details
    Object.assign(vendor, updateData); // Merge the updateData into the vendor object
    await vendor.save(); // Save the updated vendor

    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully.',
      updatedVendor: vendor,
    });
  } catch (error) {
    console.error('Error updating vendor:', error.message);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the vendor.',
      error: error.message,
    });
  }
};
