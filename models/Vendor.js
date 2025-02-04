const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true, // Ensure every vendor is linked to an organization
  },
  vendorOrganizationName: {
    type: String,
  },
  primaryPerson: {
    type: String,
  },
  displayName: {
    type: String,
    required: true,
  },
  emailAddress: {
    type: String,
  },
  phone: {
    type: String,
  },
  shippingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  billingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
  },
  taxDetails: {
    taxStatus: {
      type: String,
      required: true,
    },
    sourceState: String,
    gstin: {
      type: String,
      required: function () {
        return this.taxDetails.taxStatus === 'gstRegistered';
      },
    },
    panNumber: String,
  },
  bankDetails: [
    {
      accountHolderName: { type: String },
      bankName: { type: String },
      ifscCode: { type: String },
      accountNumber: { type: String },
    },
  ],
  currency: {
    type: String,
    default: 'INR',
  },
  tags: [String],
  notes: {
    type: String,
    maxlength: 500,
  },

  // Custom fields
  customFields: [
    {
      fieldName: { type: String },
      fieldValue: mongoose.Schema.Types.Mixed, // Flexible type for custom data
    },
  ],
}, { 
  timestamps: true,
});

// Limit bankDetails array to 10 entries
vendorSchema.path('bankDetails').validate(function (value) {
  return value.length <= 10;
}, 'A vendor can have a maximum of 10 bank details.');

module.exports = mongoose.model('Vendor', vendorSchema);