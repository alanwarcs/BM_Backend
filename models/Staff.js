// models/Staff.js
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    password: { type: String, required: true },
    googleId: { type: String },
    designation: { type: String },
    photo: { type: String },
    accessTo: { type: String },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    preferences: {
        theme: { type: String, default: 'light' },
        language: { type: String, default: 'en' }
    },
    createdAt: { type: Date, default: Date.now }
});

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;
