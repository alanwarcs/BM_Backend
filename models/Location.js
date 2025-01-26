const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    }, // Reference to the Business schema
    locationName: { 
        type: String, 
        required: true 
    }, // Name of the warehouse or location
    locationAddress: { 
        type: String, 
        required: true 
    }, // Physical address or location of the warehouse/shop
    capacity: { 
        type: Number 
    }, // Total storage capacity
}, { timestamps: true });

// Automatically update the 'updatedAt' field before saving the document
locationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
