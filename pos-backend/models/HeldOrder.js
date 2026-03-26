const mongoose = require('mongoose');

const heldOrderSchema = new mongoose.Schema(
    {
        cart: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: String,
                price: Number,
                quantity: Number,
            },
        ],
        subtotal: {
            type: Number,
            required: true,
        },
        discount: {
            type: Number,
            default: 0,
        },
        tax: {
            type: Number,
            default: 0,
        },
        cartGstPercent: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
        },
        note: {
            type: String,
            default: '',
        },
        cashier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('HeldOrder', heldOrderSchema);
