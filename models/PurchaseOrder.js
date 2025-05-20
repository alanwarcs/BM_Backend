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
  paymentStatus: { type: String, enum: ['Paid', 'UnPaid', 'Partially Paid'], default: 'UnPaid' },
  modeOfPayment: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'UPI', 'EMI'], default: '' },
  initialPaymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'UPI', ''], default: '' },
  referenceNumber: { type: String },
  billingAddress: {type: String, required: true },
  shippingAddress: { type: String, required: true },
  sourceState: { type: String, required: true },
  deliveryState: { type: String, required: true },
  deliveryLocation: { type: String },
  note: { type: String },
  emiDetails: {
    frequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', ''],
      required: function () {
        return this.modeOfPayment === 'EMI';
      }
    },
    interestRate: {
      type: Number,
      default: 0,
      min: 0
    },
    totalWithInterest: {
      type: mongoose.Schema.Types.Decimal128,
      default: '0'
    },
    advancePayment:{
      type: mongoose.Schema.Types.Decimal128,
      default: '0'
    },
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
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, required: true },
      productName: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      rate: { type: mongoose.Schema.Types.Decimal128, required: true },
      tax: { type: Number, required: true },
      discount: { type: mongoose.Schema.Types.Decimal128, default: '0' }, // Added discount field
      cgstAmount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
      sgstAmount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
      igstAmount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
      totalPrice: { type: mongoose.Schema.Types.Decimal128, required: true }
    }
  ],
  discount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
  discountType: { type: String, enum: ['Flat', 'Product'], default: 'Flat' }, // Added discountType
  roundOff: { type: Boolean, default: false }, // Added roundOff
  roundOffAmount: { type: mongoose.Schema.Types.Decimal128, default: '0' }, // Added roundOffAmount
  taxAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  totalAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  paidAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  dueAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  isDeleted: { type: Boolean, default: false },
  attachments: [
    {
      fileName: { type: String, required: true },
      filePath: { type: String, required: true },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Automatically update the 'updatedAt' field before saving the document
purchaseOrderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;