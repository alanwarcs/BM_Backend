const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    }, // Name of the tax (e.g., VAT, GST, etc.)
    rateType: { 
        type: String, 
        enum: ['Fixed', 'Percent'], 
        required: true 
    }, // The type of rate, either fixed or percentage-based
    rate: { 
        type: Number, 
        required: true 
    }, // The actual tax rate (either a fixed value or percentage)
    createdAt: { 
        type: Date, 
        default: Date.now 
    }, // Timestamp for tax creation
    updatedAt: { 
        type: Date, 
        default: Date.now 
    } // Timestamp for the last update
});

// Automatically update the 'updatedAt' field before saving the document
taxSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Tax = mongoose.model('Tax', taxSchema);

module.exports = Tax;
