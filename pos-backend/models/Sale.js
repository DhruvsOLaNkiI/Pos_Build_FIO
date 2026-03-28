const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
    {
        invoiceNo: {
            type: String,
            unique: true,
            required: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: String,
                quantity: {
                    type: Number,
                    required: true,
                },
                returnedQty: {
                    type: Number,
                    default: 0,
                },
                price: {
                    type: Number,
                    required: true,
                },
                gstPercent: Number,
                total: Number,
            },
        ],
        subtotal: {
            type: Number,
            required: true,
        },
        totalGST: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        grandTotal: {
            type: Number,
            required: true,
        },
        paymentMethods: [
            {
                method: {
                    type: String,
                    enum: ['cash', 'card', 'upi', 'cod', 'pay_at_store'],
                    required: true,
                },
                amount: {
                    type: Number,
                    required: true,
                },
            },
        ],
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
        },
        registerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Register',
        },
        orderSource: {
            type: String,
            enum: ['instore', 'app'],
            default: 'instore',
        },
        status: {
            type: String,
            enum: ['completed', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'],
            default: 'completed',
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: function() { return this.orderSource === 'instore'; },
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
        },
        deliveryAddress: {
            label: { type: String, default: '' },
            fullName: { type: String, default: '' },
            mobile: { type: String, default: '' },
            street: { type: String, default: '' },
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            pincode: { type: String, default: '' },
            landmark: { type: String, default: '' },
        },
        pointsRedeemed: {
            type: Number,
            default: 0,
        },
        returnStatus: {
            type: String,
            enum: ['none', 'partial', 'full'],
            default: 'none'
        },
        returns: [
            {
                returnDate: { type: Date, default: Date.now },
                reason: String,
                items: [
                    {
                        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                        quantity: Number,
                        refundAmount: Number,
                        addedToStock: Boolean
                    }
                ],
                totalRefund: Number,
            }
        ]
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Sale', saleSchema);
