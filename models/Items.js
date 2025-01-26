const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    }, 
    itemType: { 
        type: String, 
        enum: ['Services', 'Product'], 
        required: true 
    }, 
    itemName: { 
        type: String, 
        required: true 
    },
    locationId: [
        {
            location: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Location',
                required: false // Make location optional
            },
            quantity: {
                type: Number,
                required: false, // Quantity should be optional but can be set if location exists
                default: 0 // Default quantity
            }
        }
    ],
    units: [
        {
            category: { 
                type: String, 
                required: true 
            },
            value: { 
                type: Number,
            },
            unit: { 
                type: String, 
                required: true 
            },
            description: { 
                type: String 
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
            required: true,
            default: 'INR' 
        }
    },
    purchaseInfo: { 
        purchasePrice: { 
            type: mongoose.Schema.Types.Decimal128, 
            required: true 
        }, 
        purchaseCurrency: { 
            type: String, 
            required: true,
            default: 'INR' 
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