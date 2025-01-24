const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    }, 
    locationId: [
        {
            location: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Location',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 0 // Tracks stock quantity at this location
            }
        }
    ],
    units: [
        {
            category: { 
                type: String, 
                enum: ['quantity', 'dimension', 'weight', 'volume', 'custom'], 
                required: true 
            },
            value: { 
                type: Number, 
                required: true 
            },
            unit: { 
                type: String, 
                required: true 
            },
            description: { 
                type: String 
            },
            customAttributes: { // Flexible metadata for units
                type: Map,
                of: String
            }
        }
    ],
    sellInfo: { 
        price: { 
            type: mongoose.Schema.Types.Decimal128, 
            required: true 
        },
        currency: { 
            type: String, 
            required: true 
        }
    },
    purchaseInfo: { 
        purchasePrice: { 
            type: mongoose.Schema.Types.Decimal128, 
            required: true 
        }, 
        purchaseCurrency: { 
            type: String, 
            required: true 
        }, 
        vendorId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Vendor'
        }
    },
    gst: { 
        intraStateGST: { 
            type: mongoose.Schema.Types.Decimal128,
            default: 0 
        },
        interStateGST: { 
            type: mongoose.Schema.Types.Decimal128,
            default: 0 
        }
    },
    taxPreference: { 
        type: String, 
        enum: ['GST Inclusive', 'GST Exclusive', 'No GST'], 
        required: true, 
        default: 'GST Exclusive' 
    },
    sku: { 
        type: String 
    },
    hsnOrSac: { 
        type: String 
    },
    stockValue: { 
        type: mongoose.Schema.Types.Decimal128, 
        default: 0 // Calculated as quantity * sell price
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

// Middleware to auto-update `updatedAt`
itemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Optional method to calculate total stock across all locations
itemSchema.methods.calculateTotalStock = function() {
    return this.locationId.reduce((total, location) => total + location.quantity, 0);
};

// Optional method to calculate stock value
itemSchema.methods.calculateStockValue = function() {
    const totalQuantity = this.calculateTotalStock();
    return totalQuantity * parseFloat(this.sellInfo.price.toString());
};

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;