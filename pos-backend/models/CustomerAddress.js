const mongoose = require('mongoose');

const customerAddressSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        label: {
            type: String,
            enum: ['Home', 'Office', 'Other'],
            default: 'Home',
        },
        fullName: {
            type: String,
            required: [true, 'Please add full name'],
            trim: true,
        },
        mobile: {
            type: String,
            required: [true, 'Please add mobile number'],
            trim: true,
        },
        street: {
            type: String,
            required: [true, 'Please add street address'],
            trim: true,
        },
        city: {
            type: String,
            required: [true, 'Please add city'],
            trim: true,
        },
        state: {
            type: String,
            required: [true, 'Please add state'],
            trim: true,
        },
        pincode: {
            type: String,
            required: [true, 'Please add pincode'],
            trim: true,
        },
        landmark: {
            type: String,
            default: '',
            trim: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
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

module.exports = mongoose.model('CustomerAddress', customerAddressSchema);
