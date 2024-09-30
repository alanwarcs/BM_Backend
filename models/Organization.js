// models/Organization.js
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String },
    region: { type: String },
    country: { type: String },
    pincode: { type: Number },
    logo: { type: String },
    type: { type: String },
    subtype: { type: String },
    isGSTRegistered: { type: Boolean, default: false },
    GSTIN: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isPaid: { type: Boolean, default: false },
    termsAccepted: { type: Boolean, default: false },
    preferences: {
        dateFormat: { type: String, default: 'MM-DD-YYYY' },
        timeZone: { type: String },
        currency: { type: String }
    },
    createdAt: { type: Date, default: Date.now }
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;
