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