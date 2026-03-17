const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add an item name'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Please add a category'],
        },
        brand: {
            type: String,
            default: '',
            trim: true,
        },
        unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit',
        },
        purchasePrice: {
            type: Number,
            required: [true, 'Please add purchase price'],
        },
        sellingPrice: {
            type: Number,
            default: 0,
        },
        stockQty: {
            type: Number,
            default: 0,
        },
        minStockLevel: {
            type: Number,
            default: 10,
        },
        batchNumber: {
            type: String,
            default: '',
            trim: true,
        },
        manufacturedDate: {
            type: Date,
        },
        expiryDate: {
            type: Date,
        },
        barcode: {
            type: String,
            unique: true,
            sparse: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
