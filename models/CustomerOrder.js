const mongoose = require('mongoose');

const customerOrderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    }, // Reference to the Customer schema
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    }, // Reference to the Business schema
    orderNumber: {
        type: String,
        required: true
    }, // Unique order number
    invoiceNumber: {
        type: String,
    }, // Unique invoice number
    orderDate: {
        type: Date,
        required: true
    }, // Date of the order
    invoiceDate: {
        type: Date,
    }, // Date of the invoice
    dueDate: {
        type: Date,
    }, // Payment due date
    status: {
        type: String,
        enum: ['Completed', 'Pending', 'Cancel'],
        required: true
    }, // Status of the order/invoice
    paymentStatus: {
        type: String,
        enum: ['Paid', 'UnPaid', 'Partially Paid']
    }, // Payment status of the order
    placeOfSupply: {
        type: String,
        required: true
    }, // Place of supply
    billingAddress: {
        type: String,
    }, // Billing address
    shippingAddress: {
        type: String,
    }, // Shipping address
    note: {
        type: String
    }, // Any additional notes
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        }, // Reference to the Product schema
        productName: {
            type: String,
            required: true
        }, // Name of the product
        quantity: {
            type: Number,
            required: true
        }, // Quantity of the product
        unit: {
            type: String,
            required: true
        }, // Unit of measurement
        price: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        }, // Price of the product
        tax: {
            type: String
        }, // Tax percentage or value
        totalAmount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        } // Total amount (Quantity * Price)
    }],
    taxAmount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    }, // Total tax paid
    totalAmount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    }, // Total amount of the invoice/order
    paidAmount: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0
    }, // Total paid amount
    dueAmount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    }, // Remaining amount to be paid
    createdAt: {
        type: Date,
        default: Date.now
    }, // When the order was created
    updatedAt: {
        type: Date,
        default: Date.now
    } // When the order was last updated
});

// Automatically update the 'updatedAt' field before saving the document
customerOrderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const CustomerOrder = mongoose.model('CustomerOrder', customerOrderSchema);

module.exports = CustomerOrder;
