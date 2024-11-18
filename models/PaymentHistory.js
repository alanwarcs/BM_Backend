// models/PaymentHistory.js
const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    paymentDate: { type: Date, required: true },
    paymentId: { type: String },
    orderId: { type: String, required: true },
    status: { type: String, required: true },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

paymentHistorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const PaymentHistory = mongoose.model('PaymentHistory', paymentHistorySchema);
module.exports = PaymentHistory;