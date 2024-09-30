// models/Plan.js
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    planName: { type: String, required: true },
    price: { type: mongoose.Schema.Types.Decimal128, required: true },
    durationDays: { type: Number, required: true },
    features: { type: String }
});

const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;
