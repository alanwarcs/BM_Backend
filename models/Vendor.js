// models/Vendor.js
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: String },
    note: { type: String },
    gstPreferences: { type: String },
    gstin: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update `updatedAt` field before saving
vendorSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
