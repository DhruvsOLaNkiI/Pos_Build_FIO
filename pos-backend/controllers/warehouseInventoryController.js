const WarehouseInventory = require('../models/WarehouseInventory');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');

// @desc    Get all inventory tracking records for a specific warehouse
// @route   GET /api/warehouses/:warehouseId/inventory
// @access  Private
const getWarehouseInventory = async (req, res, next) => {
    try {
        const inventory = await WarehouseInventory.find({ warehouseId: req.params.warehouseId, companyId: req.user.companyId })
            .populate('productId', 'name barcode unit imageUrl totalStock warehouseStock stockQty')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: inventory.length, data: inventory });
    } catch (error) {
        next(error);
    }
};

// @desc    Allocate or adjust stock capacity for a product in a warehouse
// @route   POST /api/warehouses/:warehouseId/inventory
// @access  Private
const allocateStock = async (req, res, next) => {
    try {
        const { productId, stockQty, capacityLimit } = req.body;
        const warehouseId = req.params.warehouseId;

        // Verify product and warehouse exist
        const product = await Product.findOne({ _id: productId, companyId: req.user.companyId });
        if (!product) {
            res.status(404);
            return next(new Error('Product not found'));
        }

        const warehouse = await Warehouse.findOne({ _id: warehouseId, companyId: req.user.companyId });
        if (!warehouse) {
            res.status(404);
            return next(new Error('Warehouse not found'));
        }

        // Check if a record already exists
        let inventoryRecord = await WarehouseInventory.findOne({ warehouseId, productId, companyId: req.user.companyId });

        if (inventoryRecord) {
            // Update existing
            if (stockQty !== undefined) inventoryRecord.stockQty = stockQty;
            if (capacityLimit !== undefined) inventoryRecord.capacityLimit = capacityLimit;
            await inventoryRecord.save();
        } else {
            // Create new tracking
            inventoryRecord = await WarehouseInventory.create({
                warehouseId,
                productId,
                stockQty: stockQty || 0,
                capacityLimit: capacityLimit || 0,
                companyId: req.user.companyId
            });
        }

        // SYNC LOGIC: 
        // We will optionally sync this specific warehouse's stock back up to the Global `warehouseStock` 
        // if requested, but for now we just track it parallel so we don't break existing flows.

        res.status(200).json({ success: true, data: inventoryRecord });
    } catch (error) {
        next(error);
    }
};

// @desc    Transfer stock between two warehouses
// @route   POST /api/warehouses/transfer
// @access  Private
const transferStock = async (req, res, next) => {
    try {
        const { fromWarehouseId, toWarehouseId, productId, quantity } = req.body;
        const transferQty = Number(quantity);

        if (!fromWarehouseId || !toWarehouseId || !productId || !transferQty || transferQty <= 0) {
            res.status(400);
            return next(new Error('Please provide valid fromWarehouseId, toWarehouseId, productId, and transfer quantity'));
        }

        if (fromWarehouseId === toWarehouseId) {
            res.status(400);
            return next(new Error('Cannot transfer to the same warehouse'));
        }

        // Find/Validate Source
        const sourceInventory = await WarehouseInventory.findOne({ warehouseId: fromWarehouseId, productId, companyId: req.user.companyId });
        if (!sourceInventory || sourceInventory.stockQty < transferQty) {
            res.status(400);
            return next(new Error(`Insufficient stock in Source Warehouse`));
        }

        // Find/Create Destination
        let destInventory = await WarehouseInventory.findOne({ warehouseId: toWarehouseId, productId, companyId: req.user.companyId });
        if (!destInventory) {
            destInventory = await WarehouseInventory.create({ warehouseId: toWarehouseId, productId, stockQty: 0, companyId: req.user.companyId });
        }

        // Optional Capacity Check
        if (destInventory.capacityLimit > 0 && (destInventory.stockQty + transferQty) > destInventory.capacityLimit) {
            res.status(400);
            return next(new Error(`Transfer exceeds physical capacity limits of the Destination Warehouse`));
        }

        // Execute Database Updates
        sourceInventory.stockQty -= transferQty;
        destInventory.stockQty += transferQty;

        await sourceInventory.save();
        await destInventory.save();

        res.status(200).json({ success: true, message: 'Stock transferred successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove an inventory tracking record for a warehouse
// @route   DELETE /api/warehouses/:warehouseId/inventory/:id
// @access  Private
const removeWarehouseInventory = async (req, res, next) => {
    try {
        const inventoryRecord = await WarehouseInventory.findOne({ _id: req.params.id, companyId: req.user.companyId });

        if (!inventoryRecord) {
            res.status(404);
            return next(new Error('Inventory record not found'));
        }

        // Ensure the record belongs to the requested warehouse
        if (inventoryRecord.warehouseId.toString() !== req.params.warehouseId) {
            res.status(400);
            return next(new Error('Record does not match the specified warehouse'));
        }

        await inventoryRecord.deleteOne();

        res.status(200).json({ success: true, message: 'Item tracking removed from warehouse' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWarehouseInventory,
    allocateStock,
    transferStock,
    removeWarehouseInventory
};
