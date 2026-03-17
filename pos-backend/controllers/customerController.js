const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
    try {
        const customers = await Customer.find({ companyId: req.user.companyId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: customers.length, data: customers });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!customer) {
            res.status(404);
            return next(new Error('Customer not found'));
        }
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res, next) => {
    try {
        let customerId;
        while (true) {
            // Generate a random 6-digit number
            customerId = Math.floor(100000 + Math.random() * 900000).toString();
            const exists = await Customer.findOne({ customerId });
            if (!exists) break;
        }

        const customer = await Customer.create({ ...req.body, customerId, companyId: req.user.companyId });
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
    try {
        let customer = await Customer.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!customer) {
            res.status(404);
            return next(new Error('Customer not found'));
        }

        customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!customer) {
            res.status(404);
            return next(new Error('Customer not found'));
        }

        await customer.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer purchase history
// @route   GET /api/customers/:id/history
// @access  Private
const getCustomerHistory = async (req, res, next) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!customer) {
            res.status(404);
            return next(new Error('Customer not found'));
        }

        const sales = await Sale.find({ customer: req.params.id, companyId: req.user.companyId })
            .populate('seller', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            customer,
            count: sales.length,
            data: sales
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerHistory
};
