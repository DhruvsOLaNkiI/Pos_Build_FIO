const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a register name'],
        trim: true,
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
    assignedCashier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    deviceInfo: {
        type: String,
        default: '',
        description: 'Last known device/browser used for this register'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Prevent duplicate names in the same store
registerSchema.index({ name: 1, storeId: 1 }, { unique: true });

module.exports = mongoose.model('Register', registerSchema);
