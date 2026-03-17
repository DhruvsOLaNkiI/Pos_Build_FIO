const mongoose = require('mongoose');

const loyaltySettingsSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
        unique: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    pointsPerRupee: {
        type: Number,
        default: 1,        // 1 point per ₹ spent
        min: 0
    },
    rupeeValuePerPoint: {
        type: Number,
        default: 0.10,     // ₹0.10 per point when redeeming
        min: 0
    },
    minPointsToRedeem: {
        type: Number,
        default: 100       // minimum points needed before redemption
    },
    maxRedeemPercentage: {
        type: Number,
        default: 20        // max % of bill that can be paid with points
    },
    isEnabled: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltySettings', loyaltySettingsSchema);
