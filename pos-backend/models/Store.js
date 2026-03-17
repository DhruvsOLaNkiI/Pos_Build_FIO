const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a store name'],
            trim: true,
        },
        code: {
            type: String,
            required: [true, 'Please add a store code'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        address: {
            type: String,
            default: '',
        },
        pincode: {
            type: String,
            default: '',
            trim: true,
        },
        contactNumber: {
            type: String,
            default: '',
        },
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        defaultWarehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            default: null,
            description: 'The preferred warehouse for checking stock in this store'
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
            description: 'The primary store for the business'
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0] // [longitude, latitude]
            }
        }
    },
    {
        timestamps: true,
    }
);

storeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Store', storeSchema);
