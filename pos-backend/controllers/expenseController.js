const Expense = require('../models/Expense');

// @desc    Get all expenses (with optional date range & category filter)
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
    try {
        const { startDate, endDate, category, search } = req.query;
        const storeId = req.headers['x-store-id'];
        const filter = { companyId: req.user.companyId };

        if (storeId) {
            filter.storeId = storeId;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.date.$lte = end;
            }
        }

        // Category filter
        if (category && category !== 'all') {
            filter.category = category;
        }

        // Search filter
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        const expenses = await Expense.find(filter)
            .populate('createdBy', 'name')
            .sort({ date: -1 });

        // Calculate totals
        const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Category breakdown
        const categoryBreakdown = {};
        expenses.forEach((exp) => {
            if (!categoryBreakdown[exp.category]) {
                categoryBreakdown[exp.category] = 0;
            }
            categoryBreakdown[exp.category] += exp.amount;
        });

        res.status(200).json({
            success: true,
            count: expenses.length,
            totalAmount,
            categoryBreakdown,
            data: expenses,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        if (!storeId) {
            res.status(400);
            return next(new Error('Store context is required to record an expense. Please select a store.'));
        }

        const { title, amount, category, description, date } = req.body;

        const expense = await Expense.create({
            title,
            amount,
            category,
            description,
            date: date || Date.now(),
            createdBy: req.user._id,
            storeId,
            companyId: req.user.companyId,
        });

        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findOne({ _id: req.params.id, companyId: req.user.companyId });

        if (!expense) {
            res.status(404);
            return next(new Error('Expense not found'));
        }

        const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findOne({ _id: req.params.id, companyId: req.user.companyId });

        if (!expense) {
            res.status(404);
            return next(new Error('Expense not found'));
        }

        await expense.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
};
