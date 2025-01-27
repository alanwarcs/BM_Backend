const mongoose = require('mongoose');

const storageSchema = new mongoose.Schema(
    {
        businessId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Business', 
            required: true 
        }, // Reference to the Business schema
        storageType: { 
            type: String, 
            enum: ['warehouse', 'cold storage', 'retail store', 'distribution center', 'other'], 
            required: true, 
            default: 'warehouse' 
        }, // Type of storage facility
        storageName: { 
            type: String, 
            required: true 
        }, // Name of the storage/warehouse
        storageAddress: { 
            type: String, 
            required: true 
        }, // Physical address of the storage/warehouse
        capacity: { 
            type: Number, 
            min: 0 // Ensure capacity is non-negative
        }, // Total storage capacity
        capacityUnit: { 
            type: String, 
            enum: ['kg', 'liters', 'cubic meters', 'units'], 
            default: 'units' 
        }, // Unit of capacity
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt
);

// Add an index for businessId to improve query performance
storageSchema.index({ businessId: 1 });

const Storage = mongoose.model('Storage', storageSchema);

module.exports = Storage;
