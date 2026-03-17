const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a supplier name'],
            trim: true,
        },
        contactPerson: {
            type: String,
        },
        phone: {
            type: String,
            required: [true, 'Please add a phone number'],
        },
        email: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
        },
        gstNumber: {
            type: String,
        },
        totalOrders: {
            type: Number,
            default: 0,
        },
        pendingPayment: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        catalog: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
                lastUpdated: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
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

module.exports = mongoose.model('Supplier', supplierSchema);
