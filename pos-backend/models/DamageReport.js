const mongoose = require('mongoose');

const damageReportSchema = new mongoose.Schema({
    inventoryItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    batchNumber: {
        type: String,
        default: '',
    },
    damageType: {
        type: String,
        enum: ['expired', 'broken', 'water_damage', 'defective', 'other'],
        default: 'other',
    },
    quantity: {
        type: Number,
        default: 1,
    },
    description: {
        type: String,
        required: true,
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['reported', 'reviewed', 'resolved'],
        default: 'reported',
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('DamageReport', damageReportSchema);
