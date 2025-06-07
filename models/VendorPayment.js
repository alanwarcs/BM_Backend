const mongoose = require('mongoose');

const vendorPaymentSchema = new mongoose.Schema({
    purchaseOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseOrder', // Reference to the PurchaseOrder schema
        required: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    paymentDate: {
        type: Date,
        required: true
    },
    amountPaid: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        min: 0
    },
    duePayment: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    }, // Remaining amount after payment
    paymentType: {
        type: String,
        enum: ['Full Payment', 'EMI', 'Advance', 'Final Settlement'],
        required: true
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'UPI'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Success', 'Failed'],
        default: 'Success'
    },
    creditBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0
    }, // Stores positive balance if overpayment occurs
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Automatically update the 'updatedAt' field before saving the document
vendorPaymentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const VendorPayment = mongoose.model('VendorPayment', vendorPaymentSchema);

module.exports = VendorPayment;
