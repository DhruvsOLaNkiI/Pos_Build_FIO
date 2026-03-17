const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please use a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6,
            select: false, // Don't return password by default
        },
        role: {
            type: String,
            enum: ['owner', 'cashier', 'staff', 'super-admin'],
            default: 'staff',
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
        permissions: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ['active', 'pending', 'rejected'],
            default: 'pending',
        },
        phone: {
            type: String,
            default: '',
        },
        salary: {
            amount: { type: Number, default: 0 },
            frequency: {
                type: String,
                enum: ['monthly', 'hourly'],
                default: 'monthly',
            },
        },
        joiningDate: {
            type: Date,
            default: Date.now,
        },
        designation: {
            type: String,
            default: 'Staff',
        },
        shift: {
            startTime: { type: String, default: '09:00' },
            endTime: { type: String, default: '17:00' },
            workingDays: {
                type: [String],
                default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            }
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        bonus: {
            type: Number,
            default: 0,
        },
        leaveAllowance: {
            type: Number,
            default: 12,
        },
        appeals: [
            {
                subject: String,
                message: String,
                status: {
                    type: String,
                    enum: ['pending', 'resolved'],
                    default: 'pending',
                },
                response: String,
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        accessibleStores: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store'
        }],
        accessibleWarehouses: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse'
        }],
        defaultStore: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store'
        }
    },
    {
        timestamps: true,
    }
);

// Encrypt password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match entered password to hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { 
            id: this._id, 
            role: this.role,
            companyId: this.companyId 
        }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: '7d',
        }
    );
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
