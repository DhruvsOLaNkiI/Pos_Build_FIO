const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');

// @desc    Get all alerts (low stock, expiry, pending payments)
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const companyId = req.user.companyId;

        // 1. Low Stock Products (stockQty <= minStockLevel)
        const lowStockProducts = await Product.find({
            companyId,
            isActive: true,
            $expr: { $lte: ['$stockQty', '$minStockLevel'] },
        })
            .select('name category stockQty minStockLevel')
            .sort({ stockQty: 1 });

        // 2. Expiring Soon (within 30 days)
        const expiringSoon = await Product.find({
            companyId,
            isActive: true,
            expiryDate: { $gte: today, $lte: thirtyDaysFromNow },
        })
            .select('name category expiryDate stockQty')
            .sort({ expiryDate: 1 });

        // 3. Already Expired
        const expired = await Product.find({
            companyId,
            isActive: true,
            expiryDate: { $lt: today },
        })
            .select('name category expiryDate stockQty')
            .sort({ expiryDate: -1 });

        // 4. Pending Supplier Payments
        const pendingPayments = await Purchase.find({
            companyId,
            paymentStatus: 'pending',
        })
            .populate('supplier', 'name')
            .select('supplier totalAmount createdAt paymentStatus')
            .sort({ createdAt: -1 });

        // 5. Customer Credit Alerts (customers with outstanding credit)
        const creditAlerts = await Customer.find({
            companyId,
            creditBalance: { $gt: 0 },
        })
            .select('name phone creditBalance')
            .sort({ creditBalance: -1 });

        // Add days remaining to expiringSoon
        const expiringSoonWithDays = expiringSoon.map((product) => {
            const daysRemaining = Math.ceil(
                (new Date(product.expiryDate) - today) / (1000 * 60 * 60 * 24)
            );
            return {
                ...product.toObject(),
                daysRemaining,
            };
        });

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    lowStock: lowStockProducts.length,
                    expiringSoon: expiringSoon.length,
                    expired: expired.length,
                    pendingPayments: pendingPayments.length,
                    creditAlerts: creditAlerts.length,
                },
                lowStockProducts,
                expiringSoon: expiringSoonWithDays,
                expired,
                pendingPayments,
                creditAlerts,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAlerts,
};
