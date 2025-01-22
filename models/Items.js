const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    }, // Reference to the Business schema
    warehouseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Warehouse', 
    }, // Reference to the Warehouse schema
    type: { 
        type: String, 
        enum: ['Services', 'Product'], 
        required: true 
    }, // Type of item (Services/Product)
    itemName: { 
        type: String, 
        required: true 
    }, // Name of the item
    unit: { 
        type: String, 
        required: true 
    }, // Unit of measurement for the item
    description: { 
        type: String 
    }, // Item description
    sellInfo: { 
        price: { 
            type: mongoose.Schema.Types.Decimal128, 
            required: true 
        }, // Price of the item
        currency: { 
            type: String, 
            required: true 
        } // Currency used for the price
    },
    purchaseInfo: { 
        purchasePrice: { 
            type: mongoose.Schema.Types.Decimal128, 
            required: true 
        }, // Purchase price of the item
        purchaseCurrency: { 
            type: String, 
            required: true 
        }, // Currency used for the purchase price
        vendorId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Vendor'
        }, // Reference to the Vendor schema
    },
    gst: { 
        intraStateGST: { 
            type: mongoose.Schema.Types.Decimal128 
        }, // Default GST for intra-state transactions
        interStateGST: { 
            type: mongoose.Schema.Types.Decimal128 
        } // Default GST for inter-state transactions
    },
    sku: { 
        type: String 
    }, // Stock Keeping Unit identifier
    hsnOrSac: { 
        type: String 
    }, // HSN/SAC code
    availableQuantity: { 
        type: Number 
    }, // Quantity available in stock
    stockValue: { 
        type: mongoose.Schema.Types.Decimal128 
    }, // Total value of stock
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
itemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
