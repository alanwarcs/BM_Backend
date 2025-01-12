const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendorOrganizationName: {
    type: String,
    required: true,
  },
  primaryPerson: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
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
        return this.taxDetails.taxStatus === 'GST Registered';
      },
    },
    panNumber: String,
  },
  bankDetails: [
    {
      accountHolderName: { type: String, required: true },
      bankName: { type: String, required: true },
      ifscCode: { type: String, required: true },
      accountNumber: { type: String, required: true },
    },
  ],
  currency: {
    type: String,
    required: true,
    default: 'INR',
  },
  tags: [String],
  notes: String,

  // Custom fields
  customFields: [
    {
      fieldName: { type: String, required: true },
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
