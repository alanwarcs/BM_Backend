const itemSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    },
    warehouseId: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse'
        }
    ], // Multiple warehouses support, each referenced by its ID
    units: [
        {
            type: { 
                type: String, 
                enum: ['nos', 'size', 'length', 'weight'], 
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
        }, 
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
    sku: { 
        type: String 
    },
    hsnOrSac: { 
        type: String 
    },
    availableQuantity: { 
        type: Number,
        default: 0
    },
    stockValue: { 
        type: mongoose.Schema.Types.Decimal128 
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

// Automatically update the 'updatedAt' field before saving the document
itemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
