// models/SubscriptionHistory.js
const mongoose = require('mongoose');

const subscriptionHistorySchema = new mongoose.Schema({
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentHistory', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    subscriptionStatus: { type: String, required: true },
    orderId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

subscriptionHistorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const SubscriptionHistory = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);
module.exports = SubscriptionHistory;
