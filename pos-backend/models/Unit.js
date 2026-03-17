const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a unit name (e.g., Kilogram)'],
            trim: true,
        },
        shortName: {
            type: String,
            required: [true, 'Please add a short name (e.g., Kg)'],
            trim: true,
        },
        baseUnit: {
            type: String, // Optional, for conversions later if needed
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
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

// Compound unique index: same unit name allowed across different companies
unitSchema.index({ name: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('Unit', unitSchema);
