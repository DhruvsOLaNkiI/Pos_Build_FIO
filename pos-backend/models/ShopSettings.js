const mongoose = require('mongoose');

const shopSettingsSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            unique: true,
        },
        shopName: {
            type: String,
            default: 'My Shop',
            trim: true,
        },
        address: {
            type: String,
            default: '',
        },
        phone: {
            type: String,
            default: '',
        },
        email: {
            type: String,
            default: '',
        },
        gstNumber: {
            type: String,
            default: '',
        },
        defaultGST: {
            type: Number,
            default: 18,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        receiptHeader: {
            type: String,
            default: '',
        },
        receiptFooter: {
            type: String,
            default: 'Thank you for your purchase!',
        },
        lowStockThreshold: {
            type: Number,
            default: 10,
        },
        expiryAlertDays: {
            type: Number,
            default: 30,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('ShopSettings', shopSettingsSchema);
