const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a customer name'],
            trim: true,
        },
        mobile: {
            type: String,
            required: [true, 'Please add a mobile number'],
            unique: true,
        },
        customerId: {
            type: String,
            unique: true,
            sparse: true, // Allows null/missing for existing records until migrated
        },
        email: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            select: false,
        },
        otp: String,
        otpExpire: Date,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        preferredStoreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
        },
        address: {
            type: String,
        },
        creditBalance: {
            type: Number,
            default: 0,
        },
        loyaltyPoints: {
            type: Number,
            default: 0,
        },
        totalPurchases: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        totalSpent: {
            type: Number,
            default: 0,
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

// Encrypt password using bcrypt
customerSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match user entered password to hashed password in database
customerSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Customer', customerSchema);
