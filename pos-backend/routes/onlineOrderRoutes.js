const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// @desc    Get all online orders (app orders)
// @route   GET /api/online-orders?status=pending|preparing|ready|delivered|cancelled
// @access  Private
router.get('/', async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        const { status, search } = req.query;

        let query = { orderSource: 'app' };

        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }

        if (storeId && storeId !== 'all') {
            query.storeId = storeId;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await Sale.find(query)
            .populate('customer', 'name mobile customerId')
            .populate('storeId', 'name code')
            .sort({ createdAt: -1 });

        // Apply search filter after populate
        let filteredOrders = orders;
        if (search) {
            const s = search.toLowerCase();
            filteredOrders = orders.filter(o =>
                o.invoiceNo?.toLowerCase().includes(s) ||
                o.customer?.name?.toLowerCase().includes(s) ||
                o.customer?.mobile?.includes(s)
            );
        }

        const formattedOrders = filteredOrders.map(order => ({
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
            customer: order.customer ? {
                _id: order.customer._id,
                name: order.customer.name,
                mobile: order.customer.mobile,
                customerId: order.customer.customerId,
            } : null,
            store: order.storeId ? {
                _id: order.storeId._id,
                name: order.storeId.name,
                code: order.storeId.code,
            } : null,
            pointsRedeemed: order.pointsRedeemed || 0,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        }));

        // Count by status
        const allOrders = await Sale.find({ ...query, status: undefined })
            .select('status');
        const statusCounts = {
            all: allOrders.length,
            pending: allOrders.filter(o => o.status === 'pending').length,
            preparing: allOrders.filter(o => o.status === 'preparing').length,
            ready: allOrders.filter(o => o.status === 'ready').length,
            delivered: allOrders.filter(o => o.status === 'delivered').length,
            cancelled: allOrders.filter(o => o.status === 'cancelled').length,
        };

        res.status(200).json({
            success: true,
            count: formattedOrders.length,
            statusCounts,
            data: formattedOrders,
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Update order status
// @route   PUT /api/online-orders/:id/status
// @access  Private (Owner, Cashier)
router.put('/:id/status', authorize('owner', 'cashier'), async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            res.status(400);
            return next(new Error(`Status must be one of: ${validStatuses.join(', ')}`));
        }

        let query = { _id: req.params.id, orderSource: 'app' };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }

        const order = await Sale.findOne(query);

        if (!order) {
            res.status(404);
            return next(new Error('Order not found'));
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            success: true,
            data: {
                _id: order._id,
                invoiceNo: order.invoiceNo,
                status: order.status,
                updatedAt: order.updatedAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get single online order details
// @route   GET /api/online-orders/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
    try {
        let query = { _id: req.params.id, orderSource: 'app' };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }

        const order = await Sale.findOne(query)
            .populate('customer', 'name mobile customerId email')
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
                customer: order.customer,
                store: order.storeId,
                pointsRedeemed: order.pointsRedeemed || 0,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
