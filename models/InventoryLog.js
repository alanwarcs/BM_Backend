const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    storageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Storage',
      required: true
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true
    },
    type: {
      type: String,
      enum: [
        'purchase',
        'sale',
        'transfer_in',
        'transfer_out',
        'adjustment_add',
        'adjustment_remove',
        'return_purchase',
        'return_sale'
      ],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unitCost: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
      get: v => parseFloat(v.toString())
    },
    referenceType: {
      type: String,
      enum: ['PurchaseOrder', 'Invoice', 'Transfer', 'Manual', 'Return'],
      required: false
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    note: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

// Index for better performance
inventoryLogSchema.index({ businessId: 1, itemId: 1, createdAt: -1 });

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
module.exports = InventoryLog;