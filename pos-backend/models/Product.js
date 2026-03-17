const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a product name'],
            trim: true,
        },
        variant: {
            type: String,
            default: '',
            trim: true,
        },
        productType: {
            type: String,
            enum: ['Single', 'Variable'],
            default: 'Single',
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
        imageUrl: {
            type: String,
            default: '',
        },
        imageUrls: {
            type: [String],
            default: [],
        },
        purchasePrice: {
            type: Number,
            required: [true, 'Please add purchase price'],
        },
        sellingPrice: {
            type: Number,
            required: [true, 'Please add selling price'],
        },
        gstPercent: {
            type: Number,
            default: 0,
        },
        barcode: {
            type: String,
            unique: true,
            sparse: true, // Allow multiple null values if barcode is missing
        },
        expiryDate: {
            type: Date,
        },
        warranty: {
            type: String,
            default: '',
            trim: true,
        },
        manufacturer: {
            type: String,
            default: '',
            trim: true,
        },
        batches: [{
            batchNumber: { type: String, required: true },
            quantity: { type: Number, required: true, default: 0 },
            manufacturedDate: { type: Date },
            expiryDate: { type: Date },
            createdAt: { type: Date, default: Date.now },
        }],
        manufacturedDate: {
            type: Date,
        },
        stockQty: {
            type: Number,
            default: 0,
        },
        warehouseStock: {
            type: Number,
            default: 0,
        },
        minStockLevel: {
            type: Number,
            default: 10,
        },
        inventoryItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InventoryItem',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
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

module.exports = mongoose.model('Product', productSchema);
