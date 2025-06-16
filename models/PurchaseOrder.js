const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  // ----------------------------------
  // 1. PO Details
  // ----------------------------------
  poNumber: { type: String, required: true, unique: true },
  orderDate: { type: Date, required: true },
  isBillGenerated: { type: Boolean, default: false },
  dueDate: { type: Date },
  status: { type: String, enum: ['Completed', 'Pending', 'Cancel'], required: true },
  paymentStatus: { type: String, enum: ['Paid', 'UnPaid', 'Partially Paid'], default: 'UnPaid' },
  paymentType: { type: String, enum: ['Full Payment', 'EMI', 'Advance', 'Final Settlement'] },
  referenceNumber: { type: String },
  note: { type: String },

  // ----------------------------------
  // 2. Vendor Details
  // ----------------------------------
  vendor: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    name: { type: String },
    gstin: { type: String },
    gstStatus: { type: String, enum: ['Registered', 'Unregistered'] },
    state: { type: String },
    address: { type: String },
    phone: { type: String },
  },

  // ----------------------------------
  // 3. Business Details (Organization)
  // ----------------------------------
  business: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String },
    gstinStatus: { type: String },
    gstin: { type: String },
    state: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String }
  },

  // ----------------------------------
  // 4. Address Details
  // ----------------------------------
  address: {
    billing: { type: String, required: true },
    shipping: { type: String, required: true },
    sourceState: { type: String, required: true },
    deliveryState: { type: String, required: true },
    deliveryLocation: { type: String }
  },

  // ----------------------------------
  // 5. Product Details
  // ----------------------------------
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    hsnOrSacCode: { type: String },
    rate: { type: mongoose.Schema.Types.Decimal128, required: true },
    inProductDiscount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
    inProductDiscountValueType: { type: String, enum: ['Amount', 'Percent'], default: 'Percent' },
    taxes: [{
      type: { type: String, required: true },
      subType: { type: String },
      rate: { type: Number, required: true },
      amount: { type: mongoose.Schema.Types.Decimal128, default: '0' }
    }],
    totalPrice: { type: mongoose.Schema.Types.Decimal128, required: true }
  }],

  // ----------------------------------
  // 6. EMI Details (Optional)
  // ----------------------------------
  emiDetails: {
    frequency: { type: String, enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', ''] },
    interestRate: { type: Number, default: 0 },
    totalWithInterest: { type: mongoose.Schema.Types.Decimal128, default: '0' },
    advancePayment: { type: mongoose.Schema.Types.Decimal128, default: '0' },
    installments: [{
      amount: { type: mongoose.Schema.Types.Decimal128, required: true },
      dueDate: { type: Date, required: true },
      status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
      paymentDate: { type: Date },
      paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'UPI', ''], default: '' },
      paymentReference: { type: String },
      paymentNote: { type: String }
    }]
  },

  // ----------------------------------
  // 7. Pricing Summary
  // ----------------------------------
  discount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
  discountType: { type: String, enum: ['Flat', 'Product'], default: 'Flat' },
  discountValueType: { type: String, enum: ['Amount', 'Percent'], default: 'Percent' },
  totalAmountOfDiscount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
  subtotal: { type: mongoose.Schema.Types.Decimal128, required: true }, // without tax or discount(quantity x rate for each product)
  totalBeforeDiscount: { type: mongoose.Schema.Types.Decimal128, required: true }, // subtotal + tax
  roundOff: { type: Boolean, default: false },
  roundOffAmount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
  taxAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  grandAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  paidAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  dueAmount: { type: mongoose.Schema.Types.Decimal128, required: true },

  // ----------------------------------
  // 8. Terms & Attachments
  // ----------------------------------
  deliveryTerms: { type: String },
  termsAndConditions: { type: String },
  attachments: [{
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // ----------------------------------
  // 9. Audit Info
  // ----------------------------------
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  billGeneratedAt: { type: Date },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update updatedAt
purchaseOrderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
module.exports = PurchaseOrder;