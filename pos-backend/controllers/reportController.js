const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

// @desc    Get Sales Report (daily/weekly/monthly or custom range)
// @route   GET /api/reports/sales
// @access  Private
const getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate, period } = req.query;
        const storeId = req.headers['x-store-id'];

        // Build date filter
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }

        // If no dates provided, default to last 30 days
        if (!startDate && !endDate) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            dateFilter.$gte = thirtyDaysAgo;
            dateFilter.$lte = new Date();
        }

        const matchStage = { createdAt: dateFilter, companyId: req.user.companyId };
        if (storeId) {
            matchStage.storeId = storeId;
        }

        // Get all sales in range with populated products
        const sales = await Sale.find(matchStage)
            .sort({ createdAt: -1 })
            .populate('items.product', 'name brand');

        // KPIs
        const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
        const totalOrders = sales.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalGST = sales.reduce((sum, s) => sum + s.totalGST, 0);
        const totalDiscount = sales.reduce((sum, s) => sum + s.discount, 0);

        // Payment method breakdown
        const paymentBreakdown = { cash: 0, card: 0, upi: 0 };
        sales.forEach((sale) => {
            sale.paymentMethods.forEach((pm) => {
                if (paymentBreakdown[pm.method] !== undefined) {
                    paymentBreakdown[pm.method] += pm.amount;
                }
            });
        });

        // Top selling products
        const productMap = {};
        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                if (!productMap[item.name]) {
                    productMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
                }
                productMap[item.name].quantity += item.quantity;
                productMap[item.name].revenue += item.total;
            });
        });
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Sales trend (group by day)
        const trendMap = {};
        sales.forEach((sale) => {
            const dayKey = new Date(sale.createdAt).toISOString().split('T')[0];
            if (!trendMap[dayKey]) {
                trendMap[dayKey] = { date: dayKey, revenue: 0, orders: 0 };
            }
            trendMap[dayKey].revenue += sale.grandTotal;
            trendMap[dayKey].orders += 1;
        });
        const salesTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

        // Brand-wise sales breakdown using populated data
        const brandMap = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const brand = (item.product && item.product.brand) ? item.product.brand : 'No Brand';
                if (!brandMap[brand]) {
                    brandMap[brand] = { brand, revenue: 0, quantity: 0, products: {} };
                }
                brandMap[brand].revenue += item.total;
                brandMap[brand].quantity += item.quantity;

                // Per-product within brand
                if (!brandMap[brand].products[item.name]) {
                    brandMap[brand].products[item.name] = { name: item.name, revenue: 0, quantity: 0 };
                }
                brandMap[brand].products[item.name].revenue += item.total;
                brandMap[brand].products[item.name].quantity += item.quantity;
            });
        });

        const brandSales = Object.values(brandMap)
            .map(b => ({
                brand: b.brand,
                revenue: b.revenue,
                quantity: b.quantity,
                products: Object.values(b.products).sort((a, b) => b.revenue - a.revenue)
            }))
            .sort((a, b) => b.revenue - a.revenue);

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                avgOrderValue,
                totalGST,
                totalDiscount,
                paymentBreakdown,
                topProducts,
                salesTrend,
                brandSales,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Profit & Loss Report
// @route   GET /api/reports/profit-loss
// @access  Private
const getProfitLossReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const storeId = req.headers['x-store-id'];

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }

        if (!startDate && !endDate) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            dateFilter.$gte = thirtyDaysAgo;
            dateFilter.$lte = new Date();
        }

        // Prepare common query
        const query = { createdAt: dateFilter, companyId: req.user.companyId };
        const expenseQuery = { date: dateFilter, companyId: req.user.companyId };

        if (storeId) {
            query.storeId = storeId;
            expenseQuery.storeId = storeId;
        }

        // Revenue from sales with populated products
        const sales = await Sale.find(query).populate('items.product', 'purchasePrice name');
        const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
        const totalGST = sales.reduce((sum, s) => sum + s.totalGST, 0);

        // Cost of goods sold (calculated from populated products)
        let costOfGoods = 0;
        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                const purchasePrice = item.product?.purchasePrice || 0;
                costOfGoods += purchasePrice * item.quantity;
            });
        });

        // Expenses in the same period
        const expenses = await Expense.find(expenseQuery);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        // Category breakdown of expenses
        const expenseBreakdown = {};
        expenses.forEach((exp) => {
            if (!expenseBreakdown[exp.category]) {
                expenseBreakdown[exp.category] = 0;
            }
            expenseBreakdown[exp.category] += exp.amount;
        });

        // Purchases cost (stock bought from suppliers)
        const purchases = await Purchase.find(query);
        const totalPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

        const grossProfit = totalRevenue - costOfGoods;
        const netProfit = grossProfit - totalExpenses;

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                costOfGoods,
                grossProfit,
                totalExpenses,
                netProfit,
                totalGST,
                totalPurchases,
                expenseBreakdown,
                salesCount: sales.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get GST Report (for GSTR-1)
// @route   GET /api/reports/gst
// @access  Private
const getGSTReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const storeId = req.headers['x-store-id'];

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }

        if (!startDate && !endDate) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            dateFilter.$gte = thirtyDaysAgo;
            dateFilter.$lte = new Date();
        }

        const query = { createdAt: dateFilter, companyId: req.user.companyId };
        if (storeId) {
            query.storeId = storeId;
        }

        const sales = await Sale.find(query);

        // Group by GST percentage
        const gstSlabs = {};
        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                const slab = item.gstPercent || 0;
                if (!gstSlabs[slab]) {
                    gstSlabs[slab] = {
                        gstPercent: slab,
                        taxableValue: 0,
                        cgst: 0,
                        sgst: 0,
                        totalTax: 0,
                        invoiceCount: 0,
                    };
                }
                const taxableValue = item.price * item.quantity;
                const totalTax = taxableValue * (slab / 100);
                gstSlabs[slab].taxableValue += taxableValue;
                gstSlabs[slab].cgst += totalTax / 2;
                gstSlabs[slab].sgst += totalTax / 2;
                gstSlabs[slab].totalTax += totalTax;
            });
        });

        // Count unique invoices per slab
        const invoiceSlabMap = {};
        sales.forEach((sale) => {
            sale.items.forEach((item) => {
                const slab = item.gstPercent || 0;
                const key = `${slab}-${sale.invoiceNo}`;
                if (!invoiceSlabMap[key]) {
                    invoiceSlabMap[key] = true;
                    gstSlabs[slab].invoiceCount += 1;
                }
            });
        });

        const slabData = Object.values(gstSlabs).sort((a, b) => a.gstPercent - b.gstPercent);

        // Totals
        const totals = slabData.reduce(
            (acc, s) => ({
                taxableValue: acc.taxableValue + s.taxableValue,
                cgst: acc.cgst + s.cgst,
                sgst: acc.sgst + s.sgst,
                totalTax: acc.totalTax + s.totalTax,
            }),
            { taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0 }
        );

        res.status(200).json({
            success: true,
            data: {
                slabs: slabData,
                totals,
                totalInvoices: sales.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSalesReport,
    getProfitLossReport,
    getGSTReport,
};
