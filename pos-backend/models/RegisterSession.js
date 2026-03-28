const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['sale', 'payin', 'payout', 'change_given'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    note: {
        type: String,
        default: ''
    },
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const registerSessionSchema = new mongoose.Schema({
    registerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register',
        required: true
    },
    cashierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    openedAt: {
        type: Date,
        default: Date.now
    },
    closedAt: {
        type: Date,
    },
    openingBalance: {
        type: Number,
        required: true,
        default: 0
    },
    totalSales: {
        type: Number,
        default: 0
    },
    totalCashIn: {
        type: Number,
        default: 0
    },
    totalCashOut: {
        type: Number,
        default: 0
    },
    expectedBalance: {
        type: Number,
        default: 0
    },
    actualBalance: {
        type: Number,
    },
    difference: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    transactions: [transactionSchema]
}, { timestamps: true });

// Pre-save to always calculate expected balance accurately
registerSessionSchema.pre('save', function (next) {
    if (this.isModified('openingBalance') || this.isModified('totalSales') || this.isModified('totalCashIn') || this.isModified('totalCashOut')) {
        this.expectedBalance = this.openingBalance + this.totalSales + this.totalCashIn - this.totalCashOut;
    }
    
    if (this.status === 'closed' && this.actualBalance !== undefined) {
        this.difference = this.actualBalance - this.expectedBalance;
    }
    
    next();
});

module.exports = mongoose.model('RegisterSession', registerSessionSchema);
