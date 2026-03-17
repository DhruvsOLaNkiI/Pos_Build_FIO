const Warehouse = require('../models/Warehouse');
const WarehouseInventory = require('../models/WarehouseInventory');
const Product = require('../models/Product');

const User = require('../models/User');

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
const getWarehouses = async (req, res, next) => {
    try {
        let query = {};
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }

        if (req.user.role !== 'owner' && req.user.role !== 'super-admin') {
            const user = await User.findById(req.user.id);
            if (user && user.accessibleWarehouses && user.accessibleWarehouses.length > 0) {
                query._id = { $in: user.accessibleWarehouses };
            } else {
                return res.status(200).json({ success: true, count: 0, data: [] });
            }
        }
        const warehouses = await Warehouse.find(query).sort({ isDefault: -1, createdAt: 1 });
        res.status(200).json({ success: true, count: warehouses.length, data: warehouses });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single warehouse
// @route   GET /api/warehouses/:id
// @access  Private
const getWarehouse = async (req, res, next) => {
    try {
        let query = { _id: req.params.id };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        const warehouse = await Warehouse.findOne(query);
        if (!warehouse) {
            res.status(404);
            return next(new Error('Warehouse not found'));
        }
        res.status(200).json({ success: true, data: warehouse });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private (Owner only)
const createWarehouse = async (req, res, next) => {
    try {
        if (req.user.role !== 'super-admin' || !req.body.companyId) {
            req.body.companyId = req.user.companyId;
        }

        // Check if there are no warehouses, make the first one default
        const count = await Warehouse.countDocuments({ companyId: req.body.companyId });
        if (count === 0) {
            req.body.isDefault = true;
        }

        const warehouse = await Warehouse.create(req.body);
        res.status(201).json({ success: true, data: warehouse });
    } catch (error) {
        next(error);
    }
};

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private (Owner only)
const updateWarehouse = async (req, res, next) => {
    try {
        let query = { _id: req.params.id };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        let warehouse = await Warehouse.findOne(query);
        if (!warehouse) {
            res.status(404);
            return next(new Error('Warehouse not found'));
        }

        warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: warehouse });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private (Owner only)
const deleteWarehouse = async (req, res, next) => {
    try {
        let query = { _id: req.params.id };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        const warehouse = await Warehouse.findOne(query);
        if (!warehouse) {
            res.status(404);
            return next(new Error('Warehouse not found'));
        }

        if (warehouse.isDefault) {
            res.status(400);
            return next(new Error('Cannot delete the default warehouse'));
        }

        // Optional: Check if there's inventory assigned before deletion OR prompt for reallocation
        const inventoryExists = await WarehouseInventory.findOne({ warehouseId: warehouse._id, stockQty: { $gt: 0 } });
        if (inventoryExists) {
            res.status(400);
            return next(new Error('Cannot delete a warehouse that currently holds stock. Transfer stock to another location first.'));
        }

        // Cascade delete any zero-qty inventory records
        await WarehouseInventory.deleteMany({ warehouseId: warehouse._id });
        await warehouse.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWarehouses,
    getWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
};
