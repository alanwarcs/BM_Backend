const Vendor = require('../models/Vendor'); // Vendor model
const Organization = require('../models/Organization'); // Organization model
const path = require("path");
const fs = require("fs");

require('dotenv').config(); // For accessing environment variables


/**
 * Add Vendors.
 * Creates a Vendor and links it to an organization.
 */
exports.addVendors = async (req, res) => {
  try {
    const user = req.user;

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

    if (!displayName) {
      return res.status(400).json({ success: false, message: 'Display Name is required.' });
    }

    if (notes && notes.length > 500) {
      return res.status(400).json({ success: false, message: 'Notes cannot exceed 500 characters.' });
    }

    const organization = await Organization.findById(user.businessId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    // Filter out empty bankDetails and customFields
    const filteredBankDetails = (bankDetails || []).filter(bank => bank.accountNumber && bank.bankName);
    const filteredCustomFields = (customFields || []).filter(field => field.fieldName && field.fieldValue);
    const newVendor = new Vendor({
      businessId: user.businessId,
      vendorOrganizationName,
      primaryPerson,
      displayName,
      emailAddress,
      phone,
      shippingAddress,
      billingAddress,
      taxDetails,
      bankDetails: filteredBankDetails,
      currency,
      tags,
      notes,
      customFields: filteredCustomFields,
    });

    await newVendor.save();

    res.status(201).json({
      success: true,
      message: 'Vendor added successfully.',
      vendor: newVendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding the vendor.',
      error: error.message,
    });
  }
};

/**
 * Get All Vendors (Search All, Return Limited Fields).
 */
exports.getVendors = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    const { page = 1, limit = 13, gstRegistered, search } = req.query;

    // Build the query object
    const query = { businessId: user.businessId };

    // GST Filter
    if (gstRegistered === 'gstRegistered') {
      query['taxDetails.taxStatus'] = 'gstRegistered';
    } else if (gstRegistered === 'unregistered') {
      query['taxDetails.taxStatus'] = 'unregistered';
    }

    // Search Filter
    if (search) {
      query.$or = [
        { vendorOrganizationName: { $regex: search, $options: 'i' } },
        { primaryPerson: { $regex: search, $options: 'i' } },
        { emailAddress: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'shippingAddress.addressLine1': { $regex: search, $options: 'i' } },
        { 'shippingAddress.city': { $regex: search, $options: 'i' } },
        { 'shippingAddress.state': { $regex: search, $options: 'i' } },
        { 'shippingAddress.country': { $regex: search, $options: 'i' } },
        { 'billingAddress.addressLine1': { $regex: search, $options: 'i' } },
        { 'billingAddress.city': { $regex: search, $options: 'i' } },
        { 'billingAddress.state': { $regex: search, $options: 'i' } },
        { 'billingAddress.country': { $regex: search, $options: 'i' } },
        { 'taxDetails.panNumber': { $regex: search, $options: 'i' } },
        { 'taxDetails.gstin': { $regex: search, $options: 'i' } },
        { 'bankDetails.accountHolderName': { $regex: search, $options: 'i' } },
        { 'bankDetails.bankName': { $regex: search, $options: 'i' } },
        { 'bankDetails.accountNumber': { $regex: search, $options: 'i' } },
        { 'bankDetails.ifscCode': { $regex: search, $options: 'i' } },
        { currency: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    // Fetch vendors (selecting only the required fields)
    const vendors = await Vendor.find(query, {
      vendorOrganizationName: 1,
      primaryPerson: 1,
      emailAddress: 1,
      phone: 1,
    })
      .skip(skip)
      .limit(Number(limit));

    const totalVendors = await Vendor.countDocuments(query);
    const totalPages = Math.ceil(totalVendors / limit);

    // Response
    res.status(200).json({
      success: true,
      data: {
        vendors,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalVendors,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendors',
      error: error.message,
    });
  }
};

/**
 * Get Vendor Names & IDs (For Dropdowns).
 */
exports.getVendorList = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.businessId) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    // Fetch only the necessary fields
    const vendors = await Vendor.find(
      { businessId: user.businessId },
      { _id: 1, displayName: 1 } // Only select _id and vendorOrganizationName
    );

    res.status(200).json({
      success: true,
      data: vendors.map((vendor) => ({
        id: vendor._id,
        displayName: vendor.displayName,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor names.',
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
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the vendor.',
      error: error.message,
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

    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    const { vendorId } = req.params;
    let updateData = req.body;

    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID is required.' });
    }

    if (updateData.notes && updateData.notes.length > 500) {
      return res.status(400).json({ success: false, message: 'Notes cannot exceed 500 characters.' });
    }

    const vendor = await Vendor.findOne({ _id: vendorId, businessId: user.businessId });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found or unauthorized access.' });
    }

    // Filter out empty bankDetails and customFields if they exist in the update
    if (updateData.bankDetails) {
      updateData.bankDetails = updateData.bankDetails.filter(bank => bank.accountNumber && bank.bankName);
    }

    if (updateData.customFields) {
      updateData.customFields = updateData.customFields
        .filter(field => field.fieldName && field.fieldValue);
    }    

    Object.assign(vendor, updateData);
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully.',
      updatedVendor: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the vendor.',
      error: error.message,
    });
  }
};

/**
 * Print Vendor List.
 */
exports.printVendorList = async (req, res) => {
  try {
    const { selectedVendors, selectedFields } = req.body;

    if (!selectedVendors || !selectedFields || selectedVendors.length === 0) {
      return res.status(400).send("Selected vendors or fields are missing.");
    }

    const vendorIds = Object.keys(selectedVendors);
    const vendors = await Vendor.find({ _id: { $in: vendorIds } });

    const fieldMapping = {
      "Organization Name": "vendorOrganizationName",
      "Primary Person Name": "primaryPerson",
      Email: "emailAddress",
      Phone: "phone",
      "Shipping Address": "shippingAddress",
      "Billing Address": "billingAddress",
      GSTIN: "taxDetails.gstin",
      "Source State": "taxDetails.sourceState",
      "PAN Number": "taxDetails.panNumber",
    };

    const secureFields = ["GSTIN", "PAN Number"];

    const formatFieldValue = (value, fieldName) => {
      if (fieldName === "Shipping Address" || fieldName === "Billing Address") {
        return value && value.addressLine1
          ? `${value.addressLine1}, ${value.city}, ${value.state}, ${value.country}, ${value.postalCode}`
          : "-";
      }

      if (secureFields.includes(fieldName)) {
        return `<span class="hidden-field">Protected</span>`;
      }

      return value || "-";
    };

    const templatePath = path.join(__dirname, "..", "templates", "vendorList.html");
    const templateHTML = fs.readFileSync(templatePath, "utf-8");

    const generateHTML = (vendors, selectedFields) => {
      return templateHTML
        .replace(
          "{{HEADERS}}",
          selectedFields.map((field) => `<th>${field}</th>`).join("")
        )
        .replace(
          "{{ROWS}}",
          vendors
            .map(
              (vendor) =>
                `<tr>${selectedFields
                  .map((field) => {
                    const dbField = fieldMapping[field];
                    const value = dbField
                      ? dbField.split(".").reduce((o, key) => (o ? o[key] : "-"), vendor)
                      : "-";
                    return `<td>${formatFieldValue(value, field)}</td>`;
                  })
                  .join("")}</tr>`
            )
            .join("")
        );
    };

    const html = generateHTML(vendors, selectedFields);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    res.status(500).send("Failed to generate vendor list");
  }
};