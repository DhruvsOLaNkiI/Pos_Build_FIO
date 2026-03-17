const Sale = require('../models/Sale');
const Product = require('../models/Product');

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        if (!storeId) {
            res.status(400);
            return next(new Error('Store context is required to complete a sale'));
        }

        const { items, paymentMethods, customer, discount } = req.body;

        if (!items || items.length === 0) {
            res.status(400);
            return next(new Error('No items in sale'));
        }

        // Generate Invoice Number (Simple: timestamp + random)
        const invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let subtotal = 0;
        let totalGST = 0;
        const saleItems = [];

        // Calculate totals and update stock
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                res.status(404);
                return next(new Error(`Product ${item.productId} not found`));
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

        const grandTotal = subtotal + totalGST - (discount || 0);

        // Handle Customer (Find or Create)
        let saleCustomer = customer; // If ID passed directly
        const { customerName, customerPhone } = req.body;

        if (customerPhone) {
            const Customer = require('../models/Customer');
            let existingCustomer = await Customer.findOne({ mobile: customerPhone });

            if (existingCustomer) {
                saleCustomer = existingCustomer._id;
                // Update stats
                existingCustomer.totalPurchases += 1;
                existingCustomer.totalSpent = (existingCustomer.totalSpent || 0) + grandTotal;
                existingCustomer.loyaltyPoints += Math.floor(grandTotal / 100);
                await existingCustomer.save();
            } else {
                // Create new customer
                const newCustomer = await Customer.create({
                    name: customerName || 'Walk-in Customer',
                    mobile: customerPhone,
                    totalPurchases: 1,
                    totalSpent: grandTotal,
                    loyaltyPoints: Math.floor(grandTotal / 100),
                    companyId: req.user.companyId
                });
                saleCustomer = newCustomer._id;
            }
        }

        const sale = await Sale.create({
            invoiceNo,
            items: saleItems,
            subtotal,
            totalGST,
            discount,
            grandTotal,
            paymentMethods,
            customer: saleCustomer,
            seller: req.user._id,
            storeId,
            companyId: req.user.companyId
        });

        res.status(201).json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res, next) => {
    try {
        const { startDate, endDate, seller } = req.query;
        const storeId = req.headers['x-store-id'];

        let query = {};
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }

        if (storeId) {
            query.storeId = storeId;
        }

        if (seller) {
            query.seller = seller;
        }

        if (startDate && endDate) {
            // Set end date to end of the day for inclusive filtering
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            query.createdAt = {
                $gte: start,
                $lte: end
            };
        }

        const sales = await Sale.find(query)
            .populate('seller', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: sales.length, data: sales });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
const getSale = async (req, res, next) => {
    try {
        let query = { _id: req.params.id };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        const sale = await Sale.findOne(query)
            .populate('seller', 'name')
            .populate('items.product', 'name category');

        if (!sale) {
            res.status(404);
            return next(new Error('Sale not found'));
        }
        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSale,
    getSales,
    getSale
};
