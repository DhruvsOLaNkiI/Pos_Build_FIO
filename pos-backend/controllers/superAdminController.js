const Company = require('../models/Company');
const User = require('../models/User');
const Sale = require('../models/Sale');
const Store = require('../models/Store');
const Warehouse = require('../models/Warehouse');
const ShopSettings = require('../models/ShopSettings');
const bcrypt = require('bcryptjs');

// @desc    Get all companies
// @route   GET /api/super-admin/companies
// @access  Super Admin only
const getCompanies = async (req, res, next) => {
    try {
        const companies = await Company.find().sort({ createdAt: -1 });

        // Enrich each company with counts
        const enriched = await Promise.all(companies.map(async (company) => {
            const c = company.toObject();
            c.ownerCount = await User.countDocuments({ companyId: company._id, role: 'owner' });
            c.storeCount = await Store.countDocuments({ companyId: company._id });
            c.employeeCount = await User.countDocuments({ companyId: company._id });

            // Total revenue for this company
            const salesAgg = await Sale.aggregate([
                { $match: { companyId: company._id } },
                { $group: { _id: null, total: { $sum: '$grandTotal' } } }
            ]);
            c.totalRevenue = salesAgg[0]?.total || 0;
            return c;
        }));

        res.status(200).json({ success: true, count: enriched.length, data: enriched });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a single company details
// @route   GET /api/super-admin/companies/:id
// @access  Super Admin only
const getCompany = async (req, res, next) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            res.status(404);
            return next(new Error('Company not found'));
        }

        const owner = await User.findOne({ companyId: company._id, role: 'owner' }).select('name email phone createdAt');
        const storeCount = await Store.countDocuments({ companyId: company._id });
        const employeeCount = await User.countDocuments({ companyId: company._id });
        const salesAgg = await Sale.aggregate([
            { $match: { companyId: company._id } },
            { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...company.toObject(),
                owner,
                storeCount,
                employeeCount,
                totalRevenue: salesAgg[0]?.total || 0,
                totalOrders: salesAgg[0]?.count || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update company status (active/suspended/trial)
// @route   PUT /api/super-admin/companies/:id/status
// @access  Super Admin only
const updateCompanyStatus = async (req, res, next) => {
    try {
        const { isActive, plan, subscriptionStatus } = req.body;
        const company = await Company.findByIdAndUpdate(
            req.params.id,
            { isActive, plan, subscriptionStatus },
            { new: true, runValidators: true }
        );

        if (!company) {
            res.status(404);
            return next(new Error('Company not found'));
        }

        res.status(200).json({ success: true, data: company });
    } catch (error) {
        next(error);
    }
};

// @desc    Get platform-wide analytics
// @route   GET /api/super-admin/analytics
// @access  Super Admin only
const getPlatformAnalytics = async (req, res, next) => {
    try {
        const totalCompanies = await Company.countDocuments();
        const activeCompanies = await Company.countDocuments({ isActive: true });
        const totalUsers = await User.countDocuments({ role: { $ne: 'super-admin' } });

        // Total platform revenue (all time)
        const revenueAgg = await Sale.aggregate([
            { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
        ]);

        // Revenue in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentAgg = await Sale.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ]);

        // Plan breakdown
        const planBreakdown = await Company.aggregate([
            { $group: { _id: '$plan', count: { $sum: 1 } } }
        ]);

        // New companies last 30 days
        const newCompanies = await Company.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

        res.status(200).json({
            success: true,
            data: {
                totalCompanies,
                activeCompanies,
                inactiveCompanies: totalCompanies - activeCompanies,
                newCompanies,
                totalUsers,
                totalRevenue: revenueAgg[0]?.total || 0,
                totalOrders: revenueAgg[0]?.count || 0,
                revenueLastMonth: recentAgg[0]?.total || 0,
                planBreakdown
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new company + owner from Super Admin
// @route   POST /api/super-admin/companies
// @access  Super Admin only
const createCompany = async (req, res, next) => {
    try {
        const { companyName, ownerName, ownerEmail, ownerPhone, ownerPassword, plan } = req.body;

        if (!companyName || !ownerName || !ownerEmail || !ownerPassword) {
            res.status(400);
            return next(new Error('Company name, owner name, email, and password are required'));
        }

        // Check if owner email already exists
        const existingUser = await User.findOne({ email: ownerEmail });
        if (existingUser) {
            res.status(400);
            return next(new Error('A user with this email already exists'));
        }

        // 1. Create the company
        const company = await Company.create({
            name: companyName,
            email: ownerEmail,
            plan: plan || 'trial',
            isActive: true
        });

        // 2. Create a default Store for the company
        const storeCode = companyName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() + '-MAIN';
        const defaultStore = await Store.create({
            name: `${companyName} - Main Store`,
            code: storeCode,
            isDefault: true,
            isActive: true,
            companyId: company._id,
        });

        // 3. Create a default Warehouse for the company
        const warehouseCode = companyName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() + '-WH1';
        const defaultWarehouse = await Warehouse.create({
            name: `${companyName} - Main Warehouse`,
            code: warehouseCode,
            isDefault: true,
            isActive: true,
            companyId: company._id,
        });

        // Link store to warehouse
        defaultStore.defaultWarehouseId = defaultWarehouse._id;
        await defaultStore.save();

        // 4. Create default ShopSettings for the company
        await ShopSettings.create({
            companyId: company._id,
            shopName: companyName,
        });

        // 5. Create the owner user
        const defaultPermissions = [
            'dashboard', 'billing', 'products', 'inventory', 'expired-products',
            'units', 'customers', 'employees', 'suppliers', 'purchases',
            'order-tracking', 'reports', 'expenses', 'alerts', 'settings', 'warehouses', 'stores'
        ];

        const owner = await User.create({
            name: ownerName,
            email: ownerEmail,
            password: ownerPassword,
            phone: ownerPhone || '',
            role: 'owner',
            companyId: company._id,
            isApproved: true,
            status: 'active',
            permissions: defaultPermissions,
            defaultStore: defaultStore._id,
            accessibleStores: [defaultStore._id],
            accessibleWarehouses: [defaultWarehouse._id],
        });

        res.status(201).json({
            success: true,
            data: {
                company,
                owner: { _id: owner._id, name: owner.name, email: owner.email },
                defaultStore,
                defaultWarehouse
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Global settings from Super Admin
// @route   GET /api/super-admin/global-settings
// @access  Super Admin only
const getGlobalSettings = async (req, res, next) => {
    try {
        const GlobalSettings = require('../models/GlobalSettings');
        let settings = await GlobalSettings.findOne({});
        if (!settings) {
            settings = await GlobalSettings.create({ heroSectionType: 'grid' });
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

// @desc    Update Global settings from Super Admin
// @route   PUT /api/super-admin/global-settings
// @access  Super Admin only
const updateGlobalSettings = async (req, res, next) => {
    try {
        const { heroSectionType, accentColor, productCardStyle } = req.body;
        const GlobalSettings = require('../models/GlobalSettings');
        let settings = await GlobalSettings.findOne({});
        if (!settings) {
            settings = await GlobalSettings.create({ heroSectionType: 'grid' });
        }
        
        if (heroSectionType) settings.heroSectionType = heroSectionType;
        if (accentColor) settings.accentColor = accentColor;
        if (productCardStyle) settings.productCardStyle = productCardStyle;
        await settings.save();

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCompanies, getCompany, updateCompanyStatus, getPlatformAnalytics, createCompany, getGlobalSettings, updateGlobalSettings };
