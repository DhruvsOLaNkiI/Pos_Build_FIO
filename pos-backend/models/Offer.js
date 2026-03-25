const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    type: {
        type: String,
        enum: ['percentage', 'flat', 'buy_x_get_y', 'free_item', 'wholesale'],
        required: true
    },
    // For percentage: discount value is %, for flat: discount value is ₹
    discountValue: {
        type: Number,
        default: 0
    },
    maxDiscountAmount: {
        type: Number,
        default: null  // cap for percentage discounts, e.g. max ₹500 off
    },
    // Buy X Get Y
    buyQuantity: { type: Number, default: null },
    getQuantity: { type: Number, default: null },

    minPurchaseAmount: {
        type: Number,
        default: 0
    },
    couponCode: {
        type: String,
        sparse: true,
        uppercase: true,
        trim: true,
        default: null
    },
    // Auto-apply (no coupon needed) or coupon-based
    isAutoApply: {
        type: Boolean,
        default: false
    },
    applicableTo: {
        type: String,
        enum: ['all', 'category', 'product'],
        default: 'all'
    },
    applicableCategory: { type: String, default: null },
    applicableProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    minQuantity: { type: Number, default: 0 }, // For bulk/tiered purchases
    wholesalePrice: { type: Number, default: null }, // Dedicated wholesale selling price
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    usageLimit: { type: Number, default: null }, // max total redemptions
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
