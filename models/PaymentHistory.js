const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  amountPaid: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true
  },
  modeOfPayment: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'UPI'],
    required: true
  },
  paymentType: {
    type: String,
    enum: ['One-Go', 'EMI', 'Initial'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Success', 'Failed'],
    default: 'Success'
  }
});

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);