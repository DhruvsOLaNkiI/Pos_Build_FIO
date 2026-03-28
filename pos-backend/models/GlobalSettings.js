const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
    heroSectionType: {
        type: String,
        enum: ['grid', 'slider', 'carousel'],
        default: 'grid'
    },
    accentColor: {
        type: String,
        enum: ['blue', 'purple', 'emerald', 'rose', 'amber', 'indigo'],
        default: 'blue'
    },
    productCardStyle: {
        type: String,
        enum: ['minimal', 'detailed', 'compact'],
        default: 'minimal'
    },
    defaultGstPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, { timestamps: true });

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
