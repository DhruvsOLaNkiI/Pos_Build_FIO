const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Store = require('../models/Store');
const Company = require('../models/Company');
const CustomerAddress = require('../models/CustomerAddress');
const { protect } = require('../middleware/authMiddleware'); // For protected customer routes later if needed

// @desc    Get All Active Companies (for company selection screen)
// @route   GET /api/customer-app/companies
// @access  Public
router.get('/companies', async (req, res, next) => {
    try {
        const companies = await Company.find({ isActive: true }).select('name email phone address logo plan');
        
        // Enrich with store count
        const enrichedCompanies = await Promise.all(companies.map(async (company) => {
            const stores = await Store.find({ companyId: company._id, isActive: true })
                .select('name code address pincode');
            return {
                ...company.toObject(),
                stores: stores
            };
        }));

        res.status(200).json({
            success: true,
            count: enrichedCompanies.length,
            data: enrichedCompanies
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get Single Company Details with Products
// @route   GET /api/customer-app/companies/:id
// @access  Public
router.get('/companies/:id', async (req, res, next) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company || !company.isActive) {
            res.status(404);
            return next(new Error('Company not found'));
        }

        // Get stores
        const stores = await Store.find({ companyId: company._id, isActive: true })
            .select('name code address pincode');

        // Get products from all stores of this company
        const storeIds = stores.map(s => s._id);
        const products = await Product.find({ 
            storeId: { $in: storeIds }, 
            isActive: true 
        }).select('-purchasePrice -__v');

        res.status(200).json({
            success: true,
            data: {
                company: {
                    _id: company._id,
                    name: company.name,
                    email: company.email,
                    phone: company.phone,
                    address: company.address,
                    logo: company.logo
                },
                stores,
                products
            }
        });
    } catch (error) {
        next(error);
    }
});

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

// ==================== ADDRESS ENDPOINTS ====================

// @desc    Get all addresses for customer
// @route   GET /api/customer-app/auth/addresses
// @access  Private (Customer)
router.get('/auth/addresses', protect, async (req, res, next) => {
    try {
        const addresses = await CustomerAddress.find({ customerId: req.user._id })
            .sort({ isDefault: -1, createdAt: -1 });

        res.status(200).json({ success: true, data: addresses });
    } catch (error) {
        next(error);
    }
});

// @desc    Add new address
// @route   POST /api/customer-app/auth/addresses
// @access  Private (Customer)
router.post('/auth/addresses', protect, async (req, res, next) => {
    try {
        const { label, fullName, mobile, street, city, state, pincode, landmark, isDefault } = req.body;

        if (!fullName || !mobile || !street || !city || !state || !pincode) {
            res.status(400);
            return next(new Error('Please fill all required address fields'));
        }

        const customer = await Customer.findById(req.user._id);
        if (!customer) {
            res.status(404);
            return next(new Error('Customer not found'));
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            await CustomerAddress.updateMany(
                { customerId: req.user._id },
                { isDefault: false }
            );
        }

        const address = await CustomerAddress.create({
            customerId: req.user._id,
            label: label || 'Home',
            fullName,
            mobile,
            street,
            city,
            state,
            pincode,
            landmark: landmark || '',
            isDefault: isDefault || false,
            companyId: customer.companyId,
        });

        res.status(201).json({ success: true, data: address });
    } catch (error) {
        next(error);
    }
});

// @desc    Update address
// @route   PUT /api/customer-app/auth/addresses/:id
// @access  Private (Customer)
router.put('/auth/addresses/:id', protect, async (req, res, next) => {
    try {
        const address = await CustomerAddress.findOne({
            _id: req.params.id,
            customerId: req.user._id,
        });

        if (!address) {
            res.status(404);
            return next(new Error('Address not found'));
        }

        const { label, fullName, mobile, street, city, state, pincode, landmark, isDefault } = req.body;

        // If setting as default, unset other defaults
        if (isDefault && !address.isDefault) {
            await CustomerAddress.updateMany(
                { customerId: req.user._id },
                { isDefault: false }
            );
        }

        if (label !== undefined) address.label = label;
        if (fullName !== undefined) address.fullName = fullName;
        if (mobile !== undefined) address.mobile = mobile;
        if (street !== undefined) address.street = street;
        if (city !== undefined) address.city = city;
        if (state !== undefined) address.state = state;
        if (pincode !== undefined) address.pincode = pincode;
        if (landmark !== undefined) address.landmark = landmark;
        if (isDefault !== undefined) address.isDefault = isDefault;

        await address.save();

        res.status(200).json({ success: true, data: address });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete address
// @route   DELETE /api/customer-app/auth/addresses/:id
// @access  Private (Customer)
router.delete('/auth/addresses/:id', protect, async (req, res, next) => {
    try {
        const address = await CustomerAddress.findOne({
            _id: req.params.id,
            customerId: req.user._id,
        });

        if (!address) {
            res.status(404);
            return next(new Error('Address not found'));
        }

        await address.deleteOne();

        res.status(200).json({ success: true, message: 'Address deleted' });
    } catch (error) {
        next(error);
    }
});

// @desc    Set address as default
// @route   PUT /api/customer-app/auth/addresses/:id/default
// @access  Private (Customer)
router.put('/auth/addresses/:id/default', protect, async (req, res, next) => {
    try {
        const address = await CustomerAddress.findOne({
            _id: req.params.id,
            customerId: req.user._id,
        });

        if (!address) {
            res.status(404);
            return next(new Error('Address not found'));
        }

        // Unset all other defaults
        await CustomerAddress.updateMany(
            { customerId: req.user._id },
            { isDefault: false }
        );

        address.isDefault = true;
        await address.save();

        res.status(200).json({ success: true, data: address });
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

// @desc    Get Single Product Detail with Variants (Public)
// @route   GET /api/customer-app/products/:id
// @access  Public
router.get('/products/:id', async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('storeId', 'name code address pincode contactNumber')
            .populate('unit', 'name shortName')
            .select('-purchasePrice -warehouseStock -minStockLevel -batches -inventoryItemId -__v');

        if (!product) {
            res.status(404);
            return next(new Error('Product not found'));
        }

        // If product is Variable type, find sibling variants (same name, different variant)
        let variants = [];
        if (product.productType === 'Variable' && product.name) {
            variants = await Product.find({
                name: product.name,
                companyId: product.companyId,
                isActive: true,
                _id: { $ne: product._id }
            })
                .populate('storeId', 'name code')
                .select('-purchasePrice -warehouseStock -minStockLevel -batches -inventoryItemId -__v');
        }

        // Build store info
        const storeInfo = product.storeId ? {
            _id: product.storeId._id,
            name: product.storeId.name,
            code: product.storeId.code,
            address: product.storeId.address,
            pincode: product.storeId.pincode,
            contactNumber: product.storeId.contactNumber
        } : null;

        res.status(200).json({
            success: true,
            data: {
                product: {
                    ...product.toObject(),
                    storeName: storeInfo?.name || '',
                    storeCode: storeInfo?.code || '',
                    storeInfo
                },
                variants: variants.map(v => ({
                    ...v.toObject(),
                    storeName: v.storeId?.name || '',
                    storeCode: v.storeId?.code || ''
                }))
            }
        });
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
// Haversine distance calculation in km
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// @desc    Get Nearby Stores based on pincode or GPS with their products
// @route   GET /api/customer-app/stores/nearby?pincode=123456 OR ?lat=...&lng=...
// @access  Public
router.get('/stores/nearby', async (req, res, next) => {
    try {
        const { pincode, lat, lng, radius = 100 } = req.query; // Radius in KM (default 100km)
        const { geocodePincode } = require('../utils/geocoder');
        const Product = require('../models/Product');
        const maxRadius = parseInt(radius);

        // Get user coordinates
        let userLat = null;
        let userLng = null;

        if (lat && lng) {
            userLat = parseFloat(lat);
            userLng = parseFloat(lng);
        } else if (pincode) {
            const coords = await geocodePincode(pincode);
            if (coords) {
                userLat = coords.lat;
                userLng = coords.lng;
            }
        }

        if (!userLat || !userLng || (userLat === 0 && userLng === 0)) {
            // No valid coordinates — return error, no fallback to all stores
            res.status(400);
            return next(new Error('Could not determine your location. Please use GPS or enter a valid pincode.'));
        }

        // Fetch all active stores
        let allStores = await Store.find({ isActive: true });

        // Filter stores by actual distance using Haversine
        const nearbyStores = [];
        for (const store of allStores) {
            const storeLat = store.location?.coordinates?.[1];
            const storeLng = store.location?.coordinates?.[0];

            // Skip stores without valid coordinates
            if (!storeLat || !storeLng || (storeLat === 0 && storeLng === 0)) continue;

            const dist = haversineDistance(userLat, userLng, storeLat, storeLng);
            if (dist <= maxRadius) {
                nearbyStores.push({ store, distance: dist });
            }
        }

        // Sort by distance (nearest first)
        nearbyStores.sort((a, b) => a.distance - b.distance);

        // For each store, fetch its products and attach store info to each product
        const storesWithProducts = await Promise.all(
            nearbyStores.map(async ({ store, distance }) => {
                const products = await Product.find({
                    storeId: store._id,
                    isActive: true
                }).select('-purchasePrice -stock -reorderLevel -supplier -__v');

                // Attach store name, code, and id to each product so frontend can display it
                const productsWithStore = products.map(p => {
                    const prod = p.toObject();
                    prod.storeName = store.name;
                    prod.storeCode = store.code;
                    prod.storeId = store._id;
                    return prod;
                });

                return {
                    store: {
                        _id: store._id,
                        name: store.name,
                        code: store.code,
                        address: store.address,
                        pincode: store.pincode,
                        contactNumber: store.contactNumber,
                        distance: Math.round(distance * 10) / 10 // km rounded to 1 decimal
                    },
                    products: productsWithStore
                };
            })
        );

        const totalProducts = storesWithProducts.reduce((sum, s) => sum + s.products.length, 0);

        res.status(200).json({ 
            success: true, 
            storeCount: storesWithProducts.length,
            productCount: totalProducts,
            radius: maxRadius,
            userLocation: { lat: userLat, lng: userLng },
            data: storesWithProducts 
        });

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
        const { items, pointsToRedeem, pointDiscount, deliveryAddress, paymentMethod } = req.body;
        const customerId = req.user._id;

        if (!items || items.length === 0) {
            res.status(400);
            return next(new Error('No items in order'));
        }

        if (!deliveryAddress) {
            res.status(400);
            return next(new Error('Please provide a delivery address'));
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

        // Determine payment method
        const payMethod = paymentMethod || 'cod';
        const payMethodMap = {
            'cod': 'cash',
            'cash_on_delivery': 'cash',
            'upi': 'upi',
            'card': 'card',
            'pay_at_store': 'cash',
        };

        // Create the Sale/Order record
        const sale = await Sale.create({
            invoiceNo,
            items: saleItems,
            subtotal,
            totalGST,
            discount,
            grandTotal,
            paymentMethods: [{ method: payMethodMap[payMethod] || 'cash', amount: grandTotal }],
            customer: customer._id,
            orderSource: 'app',
            status: 'pending',
            storeId: store._id,
            companyId: customer.companyId,
            pointsRedeemed: pointsToRedeem || 0,
            deliveryAddress: {
                label: deliveryAddress.label || '',
                fullName: deliveryAddress.fullName || '',
                mobile: deliveryAddress.mobile || '',
                street: deliveryAddress.street || '',
                city: deliveryAddress.city || '',
                state: deliveryAddress.state || '',
                pincode: deliveryAddress.pincode || '',
                landmark: deliveryAddress.landmark || '',
            }
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

// @desc    Get customer orders (Order History)
// @route   GET /api/customer-app/auth/orders
// @access  Private (Customer)
router.get('/auth/orders', protect, async (req, res, next) => {
    try {
        const orders = await Sale.find({ customer: req.user._id, orderSource: 'app' })
            .populate('storeId', 'name code address')
            .sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({
            _id: order._id,
            invoiceNo: order.invoiceNo,
            items: order.items,
            subtotal: order.subtotal,
            totalGST: order.totalGST,
            discount: order.discount,
            grandTotal: order.grandTotal,
            paymentMethods: order.paymentMethods,
            status: order.status,
            deliveryAddress: order.deliveryAddress,
            storeName: order.storeId?.name || '',
            storeCode: order.storeId?.code || '',
            pointsRedeemed: order.pointsRedeemed || 0,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        }));

        res.status(200).json({ success: true, count: formattedOrders.length, data: formattedOrders });
    } catch (error) {
        next(error);
    }
});

// @desc    Get single order details (Invoice)
// @route   GET /api/customer-app/auth/orders/:id
// @access  Private (Customer)
router.get('/auth/orders/:id', protect, async (req, res, next) => {
    try {
        const order = await Sale.findOne({ _id: req.params.id, customer: req.user._id })
            .populate('storeId', 'name code address pincode contactNumber')
            .populate('items.product', 'name imageUrl imageUrls');

        if (!order) {
            res.status(404);
            return next(new Error('Order not found'));
        }

        res.status(200).json({
            success: true,
            data: {
                _id: order._id,
                invoiceNo: order.invoiceNo,
                items: order.items,
                subtotal: order.subtotal,
                totalGST: order.totalGST,
                discount: order.discount,
                grandTotal: order.grandTotal,
                paymentMethods: order.paymentMethods,
                status: order.status,
                deliveryAddress: order.deliveryAddress,
                store: order.storeId ? {
                    name: order.storeId.name,
                    code: order.storeId.code,
                    address: order.storeId.address,
                    pincode: order.storeId.pincode,
                    contactNumber: order.storeId.contactNumber,
                } : null,
                pointsRedeemed: order.pointsRedeemed || 0,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            }
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Cancel an order (customer can only cancel pending orders)
// @route   PUT /api/customer-app/auth/orders/:id/cancel
// @access  Private (Customer)
router.put('/auth/orders/:id/cancel', protect, async (req, res, next) => {
    try {
        const order = await Sale.findOne({ _id: req.params.id, customer: req.user._id });

        if (!order) {
            res.status(404);
            return next(new Error('Order not found'));
        }

        if (order.status !== 'pending') {
            res.status(400);
            return next(new Error('Only pending orders can be cancelled'));
        }

        // Restore stock for each item
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stockQty += item.quantity;
                await product.save();
            }
        }

        order.status = 'cancelled';
        await order.save();

        // Refund loyalty points if any were redeemed
        if (order.pointsRedeemed > 0) {
            const customer = await Customer.findById(req.user._id);
            if (customer) {
                customer.loyaltyPoints += order.pointsRedeemed;
                customer.totalPurchases = Math.max(0, (customer.totalPurchases || 1) - 1);
                customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - order.grandTotal);
                await customer.save();
            }
        }

        res.status(200).json({
            success: true,
            data: {
                _id: order._id,
                invoiceNo: order.invoiceNo,
                status: order.status,
            },
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
