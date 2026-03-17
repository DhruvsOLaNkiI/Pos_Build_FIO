const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a business name'],
            trim: true,
        },
        address: {
            type: String,
        },
        phone: {
            type: String,
        },
        email: {
            type: String,
            unique: true,
        },
        logo: {
            type: String,
        },
        plan: {
            type: String,
            enum: ['trial', 'basic', 'premium', 'enterprise'],
            default: 'trial',
        },
        subscriptionStatus: {
            type: String,
            enum: ['active', 'past_due', 'canceled', 'unpaid'],
            default: 'active',
        },
        subscriptionEndDate: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Company', companySchema);
