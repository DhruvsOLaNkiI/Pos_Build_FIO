const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a warehouse name'],
            trim: true,
        },
        code: {
            type: String,
            required: [true, 'Please add a warehouse code'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        address: {
            type: String,
            default: '',
        },
        contactNumber: {
            type: String,
            default: '',
        },
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        totalCapacity: {
            type: Number,
            default: 0,
            description: 'Overall physical capacity of the warehouse limit'
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
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

module.exports = mongoose.model('Warehouse', warehouseSchema);
