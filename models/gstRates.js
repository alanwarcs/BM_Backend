const mongoose = require('mongoose');

const gstRateSchema = new mongoose.Schema({
  totalRate: {
    type: Number,
    required: true,
    unique: true
  },
  intraState: {
    cgst: {
      rate: { type: Number, required: true }
    },
    sgst: {
      rate: { type: Number, required: true }
    }
  },
  interState: {
    igst: {
      rate: { type: Number, required: true }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt timestamp on save
gstRateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('GSTRate', gstRateSchema);