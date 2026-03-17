const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a customer name'],
            trim: true,
        },
        mobile: {
            type: String,
            required: [true, 'Please add a mobile number'],
            unique: true,
        },
        customerId: {
            type: String,
            unique: true,
            sparse: true, // Allows null/missing for existing records until migrated
        },
        email: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
        },
        creditBalance: {
            type: Number,
            default: 0,
        },
        loyaltyPoints: {
            type: Number,
            default: 0,
        },
        totalPurchases: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        totalSpent: {
            type: Number,
            default: 0,
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

module.exports = mongoose.model('Customer', customerSchema);
