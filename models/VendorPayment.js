const mongoose = require('mongoose');

const vendorPaymentSchema = new mongoose.Schema({
    vendorPOId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'PurchaseOrder', // Reference to the PurchaseOrder schema
        required: true 
    },
    paymentDate: { 
        type: Date, 
        required: true 
    },
    amount: { 
        type: mongoose.Schema.Types.Decimal128, 
        required: true 
    }, // Amount paid
    duePayment: { 
        type: mongoose.Schema.Types.Decimal128, 
        required: true 
    }, // Remaining amount after payment
    status: { 
        type: String, 
        enum: ['completed', 'pending', 'cancelled'], 
        default: 'pending',
        required: true 
    },
    creditBalance: { 
        type: mongoose.Schema.Types.Decimal128, 
        default: 0.0 
    }, // Stores positive balance if overpayment occurs
    note: { 
        type: String 
    }, // Optional note for the payment
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
vendorPaymentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const VendorPayment = mongoose.model('VendorPayment', vendorPaymentSchema);

module.exports = VendorPayment;
