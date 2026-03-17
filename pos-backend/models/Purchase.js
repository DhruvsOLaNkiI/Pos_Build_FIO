const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
    {
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: [true, 'Please add a supplier'],
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
                unitPrice: {
                    type: Number,
                    required: true,
                },
                total: Number,
                batchNumber: {
                    type: String,
                    default: '',
                    trim: true,
                },
                manufacturedDate: {
                    type: Date,
                },
                expiryDate: {
                    type: Date,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['paid', 'pending', 'partial'],
            default: 'pending',
        },
        invoiceNumber: {
            type: String,
        },
        notes: {
            type: String,
        },
        deliveryStatus: {
            type: String,
            enum: ['ordered', 'dispatched', 'delivered'],
            default: 'ordered',
        },
        expectedDeliveryDate: {
            type: Date,
        },
        deliveredAt: {
            type: Date,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        destinationWarehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
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

module.exports = mongoose.model('Purchase', purchaseSchema);
