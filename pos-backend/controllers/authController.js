const User = require('../models/User');
const Company = require('../models/Company');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (first user becomes owner, rest need owner approval)
const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, category, businessName } = req.body;

        // Check for existing user
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            return next(new Error('User already exists'));
        }

        // First registered user OR anyone registered as 'owner' creates a company and is auto-approved
        const isFirstAccount = (await User.countDocuments({})) === 0;
        const allowedRoles = ['owner', 'staff', 'cashier'];
        const role = isFirstAccount ? 'owner' : (allowedRoles.includes(category) ? category : 'staff');
        
        // Owners (and the first account) are auto-approved. Staff/Cashier are pending.
        const isApproved = (role === 'owner' || isFirstAccount) ? true : false;
        const status = (role === 'owner' || isFirstAccount) ? 'active' : 'pending';

        // Set default permissions based on created role
        let defaultPermissions = [];
        if (role === 'owner') {
            defaultPermissions = [
                'dashboard', 'billing', 'products', 'inventory', 'expired-products',
                'units', 'customers', 'employees', 'suppliers', 'purchases',
                'order-tracking', 'reports', 'expenses', 'alerts', 'settings', 'warehouses'
            ];
        } else if (role === 'cashier') {
            defaultPermissions = ['dashboard', 'billing', 'customers', 'employees'];
        } else if (role === 'staff') {
            defaultPermissions = ['dashboard', 'products', 'inventory', 'expired-products', 'customers', 'employees', 'alerts'];
        }

        let companyId = null;
        let createdStoreId = null;

        // If OWNER, create a new company first
        if (role === 'owner') {
            const company = await Company.create({
                name: businessName || `${name}'s Business`,
                email: email
            });
            companyId = company._id;

            // --- Auto-Setup Default Entities ---
            const Store = require('../models/Store');
            const Warehouse = require('../models/Warehouse');
            const ShopSettings = require('../models/ShopSettings');
            const LoyaltySettings = require('../models/LoyaltySettings');

            const defaultStore = await Store.create({
                companyId,
                name: 'Main Store',
                location: 'Headquarters',
                isDefault: true
            });
            createdStoreId = defaultStore._id;

            const defaultWarehouse = await Warehouse.create({
                companyId,
                name: 'Main Warehouse',
                location: 'Headquarters',
                isDefault: true
            });

            // Link them
            defaultStore.defaultWarehouseId = defaultWarehouse._id;
            await defaultStore.save();

            await ShopSettings.create({ companyId });
            await LoyaltySettings.create({ companyId });
        } else {
            // For staff/cashier, they MUST be invited or we need to find which company they belong to
            // For now, if there is no company context, we'll need a way to link them.
            // In a real SaaS, they would register via a company-specific link.
            // For this implementation, let's assume the first company created is the default if unspecified
            const firstCompany = await Company.findOne();
            if (firstCompany) companyId = firstCompany._id;
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role,
            isApproved,
            status,
            phone,
            companyId,
            permissions: defaultPermissions,
            defaultStore: createdStoreId,
            accessibleStores: createdStoreId ? [createdStoreId] : [],
        });

        if (user) {
            if (isFirstAccount) {
                // Owner — auto-approved, send token so they can login immediately
                sendTokenResponse(user, 201, res);
            } else {
                // Staff/Cashier — pending approval, do NOT send token
                res.status(201).json({
                    success: true,
                    pendingApproval: true,
                    message: 'Registration successful! Please wait for the owner to approve your account.'
                });
            }
        } else {
            res.status(400);
            return next(new Error('Invalid user data'));
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            res.status(400);
            return next(new Error('Please provide email and password'));
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            res.status(401);
            return next(new Error('Invalid credentials'));
        }

        if (!user.isActive) {
            res.status(403);
            return next(new Error('Your account has been deactivated'));
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            res.status(401);
            return next(new Error('Invalid credentials'));
        }

        // Check if account is approved (owners and super-admins are always approved)
        if (user.role !== 'owner' && user.role !== 'super-admin' && !user.isApproved) {
            res.status(403);
            return next(new Error('Your account is pending approval. Please contact the owner.'));
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('defaultStore accessibleStores accessibleWarehouses');
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            res.status(404);
            return next(new Error('No user found with that email'));
        }

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        // In production, you would send an email here
        // For now, return the token directly (development only)
        res.status(200).json({
            success: true,
            message: 'Password reset token generated',
            resetToken, // Remove in production
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            res.status(400);
            return next(new Error('Invalid or expired reset token'));
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 5 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// Helper: Get token from model, create cookie & send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

    const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isApproved: user.isApproved,
        salary: user.salary,
        bonus: user.bonus,
        leaveAllowance: user.leaveAllowance,
        appeals: user.appeals,
        permissions: user.permissions,
        defaultStore: user.defaultStore,
        accessibleStores: user.accessibleStores,
        accessibleWarehouses: user.accessibleWarehouses,
        companyId: user.companyId,
    };

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({ success: true, token, data: userData });
};

module.exports = {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    logout,
};
