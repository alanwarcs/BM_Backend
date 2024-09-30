const mongoose = require('mongoose');

const customerPaymentSchema = new mongoose.Schema({
    customerPoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'CustomerOrder', 
        required: true 
    }, // Reference to the CustomerOrder schema
    paymentDate: { 
        type: Date, 
        required: true 
    }, // Date of payment
    amount: { 
        type: mongoose.Schema.Types.Decimal128, 
        required: true 
    }, // Amount paid
    duePayment: { 
        type: mongoose.Schema.Types.Decimal128, 
        required: true 
    }, // Remaining amount after the payment
    creditBalance: { 
        type: mongoose.Schema.Types.Decimal128, 
        default: 0 
    }, // If there's any overpayment (credit balance)
    status: { 
        type: String, 
        enum: ['completed', 'pending', 'cancelled'],
        default: 'pending',
        required: true 
    }, // Payment status
    note: { 
        type: String 
    }, // Additional notes related to the payment
    createdAt: { 
        type: Date, 
        default: Date.now 
    }, // When the payment was created
    updatedAt: { 
        type: Date, 
        default: Date.now 
    } // When the payment was last updated
});

// Automatically update the 'updatedAt' field before saving the document
customerPaymentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const CustomerPayment = mongoose.model('CustomerPayment', customerPaymentSchema);

module.exports = CustomerPayment;
