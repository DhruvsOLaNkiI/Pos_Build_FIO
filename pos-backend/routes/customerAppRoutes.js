const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Store = require('../models/Store');
const { protect } = require('../middleware/authMiddleware'); // For protected customer routes later if needed

// @desc    Customer Login
// @route   POST /api/customer-app/auth/login
// @access  Public
router.post('/auth/login', async (req, res, next) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            res.status(400);
            return next(new Error('Please provide your Customer ID'));
        }

        const customer = await Customer.findOne({ customerId, isActive: true });

        if (!customer) {
            res.status(401);
            return next(new Error('Invalid Customer ID or account deactivated'));
        }

        // Create JWT for customer session
        const token = jwt.sign(
            { id: customer._id, role: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            success: true,
            token,
            customer: {
                _id: customer._id,
                name: customer.name,
                mobile: customer.mobile,
                customerId: customer.customerId,
                loyaltyPoints: customer.loyaltyPoints,
            }
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get Customer Profile
// @route   GET /api/customer-app/auth/me
// @access  Private (Customer)
router.get('/auth/me', protect, async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.user._id).select('-password');

        if (!customer) {
            res.status(404);
            return next(new Error('Customer not found'));
        }

        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get Customer Profile & Points
// @route   GET /api/customer-app/auth/profile
// @access  Private (Customer)
router.get('/auth/profile', protect, async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.user._id);

        if (!customer) {
            res.status(404);
            return next(new Error('Customer not found'));
        }

        res.status(200).json({
            success: true,
            customer: {
                _id: customer._id,
                name: customer.name,
                mobile: customer.mobile,
                customerId: customer.customerId,
                loyaltyPoints: customer.loyaltyPoints,
                totalSpent: customer.totalSpent,
                totalPurchases: customer.totalPurchases,
            }
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get Active Products (Public)
// @route   GET /api/customer-app/products
// @access  Public
router.get('/products', async (req, res, next) => {
    try {
        const Product = require('../models/Product');

        // Find all active products (can add storeId filter later if needed)
        const products = await Product.find({})
            // Exclude sensitive B2B data like purchasePrice, stock, and supplier config
            .select('-purchasePrice -stock -reorderLevel -supplier -__v');

        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        next(error);
    }
});

// @desc    Get Active Offers (Public)
// @route   GET /api/customer-app/offers
// @access  Public
router.get('/offers', async (req, res, next) => {
    try {
        const Offer = require('../models/Offer');
        const now = new Date();

        // Find offers that are active, and within the valid datetime range
        const offers = await Offer.find({
            isActive: true,
            $and: [
                { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
                { $or: [{ validTo: null }, { validTo: { $gte: now } }] }
            ]
        }).select('-__v -createdAt -updatedAt -storeId');

        res.status(200).json({ success: true, count: offers.length, data: offers });
    } catch (error) {
        next(error);
    }
});

// @desc    Get store loyalty settings
// @route   GET /api/customer-app/loyalty-settings
// @access  Public
router.get('/loyalty-settings', async (req, res, next) => {
    try {
        const LoyaltySettings = require('../models/LoyaltySettings');
        const settings = await LoyaltySettings.findOne(); // Fetch the global loyalty settings

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
});

// @desc    Place a new Order from App
// @route   POST /api/customer-app/orders
// @access  Private (Customer)
router.post('/orders', protect, async (req, res, next) => {
    try {
        const { items, pointsToRedeem, pointDiscount } = req.body;
        const customerId = req.user._id;

        if (!items || items.length === 0) {
            res.status(400);
            return next(new Error('No items in order'));
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            res.status(404);
            return next(new Error('Customer not found'));
        }

        // Validate points redemption
        if (pointsToRedeem > 0) {
            if (customer.loyaltyPoints < pointsToRedeem) {
                res.status(400);
                return next(new Error(`Insufficient loyalty points. You have ${customer.loyaltyPoints} points`));
            }
        }

        // We need a store to assign this order to. For now, assign to the first store belonging to the same company.
        const store = await Store.findOne({ companyId: customer.companyId });
        if (!store) {
            res.status(400);
            return next(new Error('No active store available to process this order'));
        }

        // Generate Invoice/Order Number
        const invoiceNo = `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let subtotal = 0;
        let totalGST = 0;
        const saleItems = [];

        // Verify and calculate server-side
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                res.status(404);
                return next(new Error(`Product not found`));
            }

            if (product.stockQty < item.quantity) {
                res.status(400);
                return next(new Error(`Insufficient stock for ${product.name}`));
            }

            const itemTotal = product.sellingPrice * item.quantity;
            const itemGST = (itemTotal * (product.gstPercent / 100));

            saleItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.sellingPrice,
                gstPercent: product.gstPercent,
                total: itemTotal + itemGST
            });

            subtotal += itemTotal;
            totalGST += itemGST;

            // Update stock
            product.stockQty -= item.quantity;
            await product.save();
        }

        let grandTotal = subtotal + totalGST;
        let discount = 0;

        // Apply points discount
        if (pointsToRedeem > 0 && pointDiscount > 0) {
            discount = pointDiscount;
            grandTotal = Math.max(0, grandTotal - discount);

            // Deduct redeemed points from customer
            customer.loyaltyPoints -= pointsToRedeem;
        }

        // Create the Sale/Order record
        const sale = await Sale.create({
            invoiceNo,
            items: saleItems,
            subtotal,
            totalGST,
            discount,
            grandTotal,
            paymentMethods: [{ method: 'cash', amount: grandTotal }],
            customer: customer._id,
            orderSource: 'app',
            status: 'pending',
            storeId: store._id,
            companyId: customer.companyId,
            pointsRedeemed: pointsToRedeem || 0
        });

        // Update customer points and stats
        customer.totalPurchases += 1;
        customer.totalSpent = (customer.totalSpent || 0) + grandTotal;

        // Add points earned from this purchase (10% of subtotal by default)
        const pointsEarned = Math.floor(subtotal / 100);
        customer.loyaltyPoints += pointsEarned;
        await customer.save();

        res.status(201).json({
            success: true,
            data: sale,
            pointsEarned,
            pointsRedeemed: pointsToRedeem || 0,
            remainingPoints: customer.loyaltyPoints
        });
    } catch (error) {
        next(error);
    }
});

// Customer Activity Tracking Routes
const CustomerActivity = require('../models/CustomerActivity');

// @desc    Track customer activity
// @route   POST /api/customer-app/activity/track
// @access  Private (Customer)
router.post('/activity/track', protect, async (req, res, next) => {
    try {
        const {
            activityType,
            page,
            productId,
            productName,
            sessionId,
            isNewSession,
            orderId,
            amount
        } = req.body;

        const customerId = req.user._id;
        const customer = await Customer.findById(customerId);

        if (!customer) {
            res.status(404);
            return next(new Error('Customer not found'));
        }

        const activity = await CustomerActivity.create({
            customerId,
            companyId: customer.companyId,
            activityType,
            page,
            productId,
            productName,
            orderId,
            amount,
            sessionId,
            isNewSession: isNewSession || false,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress
        });

        res.status(201).json({
            success: true,
            data: activity
        });
    } catch (error) {
        console.error('Error tracking customer activity:', error);
        next(error);
    }
});

// @desc    Update activity duration
// @route   PUT /api/customer-app/activity/:id/duration
// @access  Private (Customer)
router.put('/activity/:id/duration', protect, async (req, res, next) => {
    try {
        const { duration } = req.body;

        const activity = await CustomerActivity.findByIdAndUpdate(
            req.params.id,
            {
                endTime: new Date(),
                duration
            },
            { new: true, runValidators: true }
        );

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error) {
        console.error('Error updating activity duration:', error);
        next(error);
    }
});

module.exports = router;
