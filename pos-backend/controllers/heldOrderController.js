const HeldOrder = require('../models/HeldOrder');

// @desc    Hold an active cart transaction
// @route   POST /api/held-orders
// @access  Private (Cashier/Owner)
const createHeldOrder = async (req, res, next) => {
    try {
        const { cart, subtotal, discount, tax, total, customer, note } = req.body;

        if (!cart || cart.length === 0) {
            res.status(400);
            return next(new Error('Cannot hold an empty cart'));
        }

        const formattedCart = cart.map(item => ({
            product: item._id,
            name: item.name,
            price: item.sellingPrice || item.price,
            quantity: item.quantity
        }));

        const heldOrder = await HeldOrder.create({
            cart: formattedCart,
            subtotal,
            discount,
            tax,
            total,
            customer: customer || undefined,
            note,
            cashier: req.user._id,
            companyId: req.user.companyId,
        });

        res.status(201).json({
            success: true,
            data: heldOrder,
            message: 'Order placed on hold successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all held orders for the current cashier
// @route   GET /api/held-orders
// @access  Private
const getHeldOrders = async (req, res, next) => {
    try {
        let query = { cashier: req.user._id, companyId: req.user.companyId };

        const heldOrders = await HeldOrder.find(query)
            .populate('customer', 'name phone')
            .populate('cart.product')
            .sort({ createdAt: -1 });

        // Map the populated products back to the structure the frontend cart expects
        const formattedOrders = heldOrders.map(order => {
            const orderObj = order.toObject();
            orderObj.cart = orderObj.cart.map(item => {
                const p = item.product || {};
                return {
                    _id: p._id || item._id,
                    name: item.name,
                    sellingPrice: item.price,
                    quantity: item.quantity,
                    stockQty: p.stockQty || 999,
                    category: p.category || 'Unknown',
                    barcode: p.barcode || ''
                };
            });
            return orderObj;
        });

        res.status(200).json({
            success: true,
            count: formattedOrders.length,
            data: formattedOrders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a held order (used when recalling it to cart, or just trashing it)
// @route   DELETE /api/held-orders/:id
// @access  Private
const deleteHeldOrder = async (req, res, next) => {
    try {
        const heldOrder = await HeldOrder.findOne({ _id: req.params.id, companyId: req.user.companyId });

        if (!heldOrder) {
            res.status(404);
            return next(new Error('Held order not found'));
        }

        // Ensure user owns this hold, or is owner
        if (heldOrder.cashier.toString() !== req.user.id && req.user.role !== 'owner') {
            res.status(403);
            return next(new Error('Not authorized to delete this held order'));
        }

        await heldOrder.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Held order removed'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createHeldOrder,
    getHeldOrders,
    deleteHeldOrder
};
