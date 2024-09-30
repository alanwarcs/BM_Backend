// models/PurchaseOrder.js
const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    purchaseOrderNumber: { type: String, required: true },
    billNumber: { type: String },
    orderDate: { type: Date, required: true },
    billDate: { type: Date },
    dueDate: { type: Date },
    status: { type: String, enum: ['Completed', 'Pending', 'Cancel'], required: true },
    paymentStatus: { type: String, enum: ['Paid', 'UnPaid', 'Partially Paid'] },
    billingAddress: { type: String },
    shippingAddress: { type: String },
    note: { type: String },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Product ID reference
            productName: { type: String, required: true },                   // Product Name
            quantity: { type: Number, required: true },                     // Quantity
            unit: { type: String, required: true },                         // Unit of measurement
            price: { type: mongoose.Schema.Types.Decimal128, required: true }, // Price of product
            tax: { type: String },                                           // Tax applied
            totalPrice: { type: mongoose.Schema.Types.Decimal128, required: true } // Total price including tax
        }
    ], // Nested array of product objects
    taxAmount: { type: mongoose.Schema.Types.Decimal128, required: true }, // Total tax paid
    totalAmount: { type: mongoose.Schema.Types.Decimal128, required: true }, // Total amount of the purchase order
    paidAmount: { type: mongoose.Schema.Types.Decimal128, required: true }, // Amount paid
    dueAmount: { type: mongoose.Schema.Types.Decimal128, required: true }, // Remaining amount to be paid
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update the updatedAt field before saving
purchaseOrderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
module.exports = PurchaseOrder;
