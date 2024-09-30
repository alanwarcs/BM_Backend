const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    }, // Reference to the Business schema
    warehouseName: { 
        type: String, 
        required: true 
    }, // Name of the warehouse
    location: { 
        type: String, 
    }, // Location of the warehouse
    capacity: { 
        type: Number, 
    }, // Total storage capacity of the warehouse
    createdAt: { 
        type: Date, 
        default: Date.now 
    }, // Timestamp for warehouse creation
    updatedAt: { 
        type: Date, 
        default: Date.now 
    } // Timestamp for the last update
});

// Automatically update the 'updatedAt' field before saving the document
warehouseSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;
