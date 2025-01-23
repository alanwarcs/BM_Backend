const itemSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    }, 
    locationId: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location'
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
            customAttributes: {
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
