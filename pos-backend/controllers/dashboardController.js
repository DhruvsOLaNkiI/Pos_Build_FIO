const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

// @desc    Get dashboard analytics
// @route   GET /api/dashboard?range=7d|30d|90d
// @access  Private
const getDashboardStats = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        const mongoose = require('mongoose');

        let baseMatch = {};
        if (req.user.role !== 'super-admin') {
            baseMatch.companyId = req.user.companyId;
        }
        if (storeId && storeId !== 'all') {
            baseMatch.storeId = new mongoose.Types.ObjectId(storeId);
        }

        // Filter by order source: 'all', 'instore', 'app'
        const source = req.query.source || 'all';
        if (source === 'instore') {
            baseMatch.orderSource = 'instore';
        } else if (source === 'app' || source === 'online') {
            baseMatch.orderSource = 'app';
        }
        // 'all' = no orderSource filter, shows combined data

        const range = req.query.range || '7d';
        let daysBack = 7;
        let dateFormat = '%Y-%m-%d';
        let labelFormat = { weekday: 'short' };

        if (range === '1d') {
            daysBack = 1;
            labelFormat = { hour: '2-digit', minute: '2-digit' };
        } else if (range === '30d') {
            daysBack = 30;
            labelFormat = { day: '2-digit', month: 'short' };
        } else if (range === '90d' || range === '6m') {
            daysBack = range === '90d' ? 90 : 180;
            dateFormat = '%Y-%U'; // group by week
            labelFormat = null; // handled manually
        } else if (range === '1y') {
            daysBack = 365;
            dateFormat = '%Y-%m'; // group by month
            labelFormat = null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Total Sales Today
        const todaySales = await Sale.aggregate([
            { $match: { ...baseMatch, createdAt: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
        ]);

        // Total Purchases Today
        const todayPurchases = await Purchase.aggregate([
            { $match: { ...baseMatch, createdAt: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ]);

        // 2. Low Stock Products
        let lowStockQuery = { $expr: { $lte: ['$stockQty', '$minStockLevel'] } };
        if (storeId && storeId !== 'all') lowStockQuery.storeId = storeId;
        const lowStockCount = await Product.countDocuments(lowStockQuery);

        // 3. Sales & Purchase Analytics (dynamic range)
        const rangeStart = new Date();
        rangeStart.setDate(rangeStart.getDate() - (daysBack - 1));
        rangeStart.setHours(0, 0, 0, 0);

        let salesTrend = [];
        let purchaseTrend = [];
        let chartData = [];

        if (range === '90d' || range === '6m') {
            // Group by week
            salesTrend = await Sale.aggregate([
                { $match: { ...baseMatch, createdAt: { $gte: rangeStart } } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, week: { $isoWeek: '$createdAt' } },
                        amount: { $sum: '$grandTotal' }, minDate: { $min: '$createdAt' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.week': 1 } }
            ]);
            purchaseTrend = await Purchase.aggregate([
                { $match: { ...baseMatch, createdAt: { $gte: rangeStart } } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, week: { $isoWeek: '$createdAt' } },
                        amount: { $sum: '$grandTotal' }, minDate: { $min: '$createdAt' }
                    }
                }
            ]);

            chartData = salesTrend.map(s => {
                const p = purchaseTrend.find(pt => pt._id.year === s._id.year && pt._id.week === s._id.week);
                return {
                    date: `W${s._id.week}`,
                    fullDate: s.minDate.toISOString().split('T')[0],
                    sales: s.amount,
                    purchase: p ? p.amount : 0
                };
            });
        } else if (range === '1y') {
            // Group by month
            salesTrend = await Sale.aggregate([
                { $match: { ...baseMatch, createdAt: { $gte: rangeStart } } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        amount: { $sum: '$grandTotal' }, minDate: { $min: '$createdAt' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);
            purchaseTrend = await Purchase.aggregate([
                { $match: { ...baseMatch, createdAt: { $gte: rangeStart } } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        amount: { $sum: '$grandTotal' }, minDate: { $min: '$createdAt' }
                    }
                }
            ]);

            chartData = salesTrend.map(s => {
                const p = purchaseTrend.find(pt => pt._id.year === s._id.year && pt._id.month === s._id.month);
                const monthName = s.minDate.toLocaleString('default', { month: 'short' });
                return {
                    date: `${monthName} ${s._id.year}`,
                    fullDate: s.minDate.toISOString().split('T')[0],
                    sales: s.amount,
                    purchase: p ? p.amount : 0
                };
            });
        } else {
            // Group by day or hour (for 1d)
            const formatStr = range === '1d' ? '%Y-%m-%d-%H' : '%Y-%m-%d';
            salesTrend = await Sale.aggregate([
                { $match: { ...baseMatch, createdAt: { $gte: rangeStart } } },
                {
                    $group: {
                        _id: { $dateToString: { format: formatStr, date: '$createdAt' } },
                        amount: { $sum: '$grandTotal' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            purchaseTrend = await Purchase.aggregate([
                { $match: { ...baseMatch, createdAt: { $gte: rangeStart } } },
                {
                    $group: {
                        _id: { $dateToString: { format: formatStr, date: '$createdAt' } },
                        amount: { $sum: '$grandTotal' }
                    }
                }
            ]);

            if (range === '1d') {
                for (let i = 0; i < 24; i++) {
                    const hourStr = `${today.toISOString().split('T')[0]}-${i.toString().padStart(2, '0')}`;
                    const sData = salesTrend.find(s => s._id === hourStr);
                    const pData = purchaseTrend.find(p => p._id === hourStr);
                    let ampm = i >= 12 ? 'PM' : 'AM';
                    let h = i % 12 || 12;
                    chartData.push({
                        date: `${h} ${ampm}`,
                        fullDate: hourStr,
                        sales: sData ? sData.amount : 0,
                        purchase: pData ? pData.amount : 0
                    });
                }
            } else {
                for (let i = 0; i < daysBack; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - (daysBack - 1 - i));
                    const dateStr = d.toISOString().split('T')[0];
                    const sData = salesTrend.find(s => s._id === dateStr);
                    const pData = purchaseTrend.find(p => p._id === dateStr);
                    chartData.push({
                        date: d.toLocaleDateString('en-US', labelFormat),
                        fullDate: dateStr,
                        sales: sData ? sData.amount : 0,
                        purchase: pData ? pData.amount : 0
                    });
                }
            }
        }

        const totalSalesInPeriod = chartData.reduce((sum, d) => sum + d.sales, 0);
        const totalPurchaseInPeriod = chartData.reduce((sum, d) => sum + d.purchase, 0);
        const avgDailySales = daysBack > 0 ? totalSalesInPeriod / (range === '1d' ? 1 : daysBack) : 0;

        // 4. Top Selling Products
        const topProducts = await Sale.aggregate([
            { $match: { ...baseMatch, createdAt: { $gte: rangeStart } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    totalQty: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.total' }
                }
            },
            { $sort: { totalQty: -1 } },
            { $limit: 3 } // Only 3 to match UI
        ]);

        // 5. Top Categories (Based on Product database)
        const topCategories = await Product.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 4 }
        ]);

        const totalCategoryCount = topCategories.reduce((acc, cat) => acc + cat.count, 0);

        // 6. Order Statistics (Heatmap Data)
        // Group by Day of Week (1-7, 1=Sunday) and Hour (0-23)
        const orderStats = await Sale.aggregate([
            { $match: { ...baseMatch, createdAt: { $gte: rangeStart } } },
            {
                $group: {
                    _id: {
                        day: { $dayOfWeek: '$createdAt' },
                        hour: { $hour: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 7. Overall Information
        const totalSuppliers = await Supplier.countDocuments(baseMatch);
        const totalCustomers = await Customer.countDocuments(baseMatch);
        const totalOrders = await Sale.countDocuments(baseMatch);
        const totalProductsCount = await Product.countDocuments(baseMatch);

        // 8. Customers Overview (New vs Returning over period)
        const customerOrders = await Sale.aggregate([
            { $match: { ...baseMatch, createdAt: { $gte: rangeStart }, customerPhone: { $ne: null }, 'customerPhone': { $ne: '-' } } },
            {
                $group: {
                    _id: '$customerPhone',
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        let firstTime = 0;
        let returning = 0;
        customerOrders.forEach(c => {
            if (c.orderCount === 1) firstTime++;
            else returning++;
        });

        const totalKnownCustomers = firstTime + returning || 1; // avoid /0

        res.status(200).json({
            success: true,
            data: {
                todaySales: todaySales[0]?.total || 0,
                todayPurchases: todayPurchases[0]?.total || 0,
                todayOrders: todaySales[0]?.count || 0,
                lowStockCount,
                totalProducts: totalProductsCount,
                avgDailySales,
                totalSalesInPeriod,
                totalPurchaseInPeriod,
                // Charts Data
                salesAndPurchaseTrend: chartData,
                topProducts: topProducts.map(p => ({
                    name: p._id,
                    qty: p.totalQty,
                    revenue: p.totalRevenue
                })),
                topCategories: topCategories.map((c, i) => ({
                    name: c._id || 'Uncategorized',
                    count: c.count,
                    percentage: totalCategoryCount > 0 ? ((c.count / totalCategoryCount) * 100).toFixed(1) : 0
                })),
                orderStats,
                // Overview stats
                overall: {
                    suppliers: totalSuppliers,
                    customers: totalCustomers,
                    orders: totalOrders
                },
                customerOverview: {
                    firstTime,
                    returning,
                    firstTimePercent: ((firstTime / totalKnownCustomers) * 100).toFixed(0),
                    returningPercent: ((returning / totalKnownCustomers) * 100).toFixed(0)
                },
                periodLabel: range.toUpperCase()
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats
};
