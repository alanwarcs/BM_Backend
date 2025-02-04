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
        required: [true, 'Item type is required']
    },
    itemName: {
        type: String,
        required: [true, 'Item name is required']
    },
    storage: [
        {
            storage: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Storage',
                required: false
            },
            quantity: {
                type: Number,
                required: false,
                default: 0
            }
        }
    ],
    units: [
        {
            category: {
                type: String,
                required: function() { return this.value > 0; }  // category required if value is entered
            },
            value: {
                type: Number,
                default: 1
            },
            unit: {
                type: String,
                required: function() { return this.value > 0; }  // unit required if value is entered
            },
            description: {
                type: String,
                default: ''
            }
        }
    ],
    sellInfo: {
        price: {
            type: mongoose.Schema.Types.Decimal128,
            required: [true, 'Cell price is required'],
            get: v => parseFloat(v.toString()) // Return as number
        },
        currency: {
            type: String,
            required: [true, 'Currency for cell price is required'],
            default: 'INR'
        }
    },
    purchaseInfo: {
        purchasePrice: {
            type: mongoose.Schema.Types.Decimal128,
            required: [true, 'Purchase price is required'],
            get: v => parseFloat(v.toString()) // Return as number
        },
        purchaseCurrency: {
            type: String,
            required: [true, 'Currency for purchase price is required'],
            default: 'INR'
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: false
        }
    },
    gst: {
        intraStateGST: {
            type: mongoose.Schema.Types.Decimal128,
            default: 0,
            get: v => parseFloat(v.toString()) // Return as number
        },
        interStateGST: {
            type: mongoose.Schema.Types.Decimal128,
            default: 0,
            get: v => parseFloat(v.toString()) // Return as number
        }
    },
    taxPreference: {
        type: String,
        enum: ['GST Inclusive', 'GST Exclusive', 'No GST'],
        required: [true, 'Tax preference is required'],
        default: 'GST Exclusive'
    },
    sku: {
        type: String,
        default: ''
    },
    hsnOrSac: {
        type: String,
        default: ''
    },
    stockValue: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
        get: v => parseFloat(v.toString()) // Return as number
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { 
    toJSON: { getters: true }, // Enable getters in JSON output
    toObject: { getters: true } 
});

// Middleware to auto-update `updatedAt`
itemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;