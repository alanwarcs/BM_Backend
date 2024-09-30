const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    }, // Reference to the Business schema
    customerType: { 
        type: String, 
        enum: ['business/organisation', 'individual'], 
        required: true 
    }, // Type of customer (Business/Organisation or Individual)
    name: { 
        type: String, 
        required: true 
    }, // Customer name
    contactPerson: { 
        type: String 
    }, // Contact person for Business/Organisation
    email: { 
        type: String 
    }, // Customer email
    phone: { 
        type: String 
    }, // Customer phone number
    address: { 
        type: String 
    }, // Customer address
    gstPreferences: { 
        type: String 
    }, // GST preferences for the customer
    gstin: { 
        type: String 
    }, // GSTIN number (if applicable)
    note: { 
        type: String 
    }, // Additional notes about the customer
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Automatically update the 'updatedAt' field before saving the document
customerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
