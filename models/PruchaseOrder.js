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
  type: { type: String, enum: ['Advance', 'Final', 'Milestone'], default: 'Final' },
  referenceNumber: { type: String },
  billingAddress: {
    address: { type: String, required: true },
    state: { type: String, required: true }
  },
  shippingAddress: {
    address: { type: String, required: true },
    state: { type: String, required: true }
  },
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
      taxStatus: { type: String, enum: ['GST Inclusive', 'GST Exclusive'], default: 'GST Exclusive' },
      cgstAmount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
      sgstAmount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
      igstAmount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
      totalPrice: { type: mongoose.Schema.Types.Decimal128, required: true }
    }
  ],
  discount: { type: mongoose.Schema.Types.Decimal128, default: '0' },
  taxAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  totalAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  paidAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  dueAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  isDeleted: { type: Boolean, default: false },
  attechments: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Validation
purchaseOrderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  // EMI validation
  if (this.modeOfPayment === 'EMI') {
    if (!this.emiDetails || !this.emiDetails.frequency || !this.emiDetails.installments || this.emiDetails.installments.length === 0) {
      return next(new Error('emiDetails with frequency and at least one installment is required for EMI mode'));
    }
    const installmentTotal = this.emiDetails.installments.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const expectedTotal = parseFloat(this.emiDetails.totalWithInterest || this.dueAmount);
    if (Math.abs(installmentTotal - expectedTotal) > 0.01) {
      return next(new Error('Installment total does not match totalWithInterest or dueAmount'));
    }
  }

  // Initial payment method validation
  if (parseFloat(this.paidAmount) > 0 && !this.initialPaymentMethod) {
    return next(new Error('initialPaymentMethod is required when paidAmount is greater than 0'));
  }

  // Discount validation
  if (parseFloat(this.discount) < 0) {
    return next(new Error('Discount cannot be negative'));
  }

  // GST validation
  const isIntraState = this.billingAddress.state === this.shippingAddress.state;
  this.products.forEach(product => {
    if (isIntraState) {
      if (parseFloat(product.cgstAmount) <= 0 || parseFloat(product.sgstAmount) <= 0 || parseFloat(product.igstAmount) > 0) {
        return next(new Error('Intra-state products must have CGST and SGST amounts, and IGST must be 0'));
      }
    } else {
      if (parseFloat(product.igstAmount) <= 0 || parseFloat(product.cgstAmount) > 0 || parseFloat(product.sgstAmount) > 0) {
        return next(new Error('Inter-state products must have IGST amount, and CGST/SGST must be 0'));
      }
    }
  });

  // Tax and total amount validation
  const calculatedTaxAmount = this.products.reduce((sum, p) => {
    return sum + parseFloat(p.cgstAmount || 0) + parseFloat(p.sgstAmount || 0) + parseFloat(p.igstAmount || 0);
  }, 0);
  if (Math.abs(calculatedTaxAmount - parseFloat(this.taxAmount)) > 0.01) {
    return next(new Error('taxAmount does not match sum of product CGST, SGST, and IGST amounts'));
  }

  const calculatedTotalAmount = this.products.reduce((sum, p) => sum + parseFloat(p.totalPrice || 0), 0) - parseFloat(this.discount || 0);
  if (Math.abs(calculatedTotalAmount - parseFloat(this.totalAmount)) > 0.01) {
    return next(new Error('totalAmount does not match sum of product totalPrice minus discount'));
  }

  next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
module.exports = PurchaseOrder;