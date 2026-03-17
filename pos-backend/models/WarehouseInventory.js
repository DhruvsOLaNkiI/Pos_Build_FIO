const mongoose = require('mongoose');

const warehouseInventorySchema = new mongoose.Schema(
    {
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        stockQty: {
            type: Number,
            default: 0,
            required: true,
        },
        capacityLimit: {
            type: Number,
            default: 0,
            description: 'Optional max amount of this product that should be kept at this location'
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

// Prevent duplicate entries for the same product in the same warehouse
warehouseInventorySchema.index({ warehouseId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('WarehouseInventory', warehouseInventorySchema);
