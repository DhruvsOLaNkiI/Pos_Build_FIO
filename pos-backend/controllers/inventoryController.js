const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
const getInventoryItems = async (req, res, next) => {
    try {
        const WarehouseInventory = require('../models/WarehouseInventory');

        // Fetch InventoryItem records
        const items = await InventoryItem.find({ companyId: req.user.companyId }).populate('unit', 'name shortName').sort({ name: 1 });
        const itemsObj = items.map(item => item.toObject());

        // Find all products for this company
        const allProducts = await Product.find({ companyId: req.user.companyId });

        // Build inventoryItemId -> [productId] map
        const productMap = {};
        allProducts.forEach(p => {
            if (p.inventoryItemId) {
                const key = p.inventoryItemId.toString();
                if (!productMap[key]) productMap[key] = [];
                productMap[key].push(p._id);
            }
        });

        // Fetch warehouse allocations (optionally filtered by warehouse)
        let allocationQuery = { companyId: req.user.companyId };

        // Enforce access control for non-owners or To change it To another 
        if (req.user.role !== 'owner' && req.user.role !== 'super-admin') {
            const user = await require('../models/User').findById(req.user.id);
            const accessibleWH = (user?.accessibleWarehouses || []).map(id => id.toString());

            if (req.query.warehouseId && req.query.warehouseId !== 'all') {
                if (!accessibleWH.includes(req.query.warehouseId)) {
                    res.status(403);
                    return next(new Error('Access to this warehouse is denied'));
                }
                allocationQuery.warehouseId = req.query.warehouseId;
            } else {
                // Restrict 'all' to only accessible warehouses
                allocationQuery.warehouseId = { $in: user?.accessibleWarehouses || [] };
            }
        } else if (req.query.warehouseId && req.query.warehouseId !== 'all') {
            allocationQuery.warehouseId = req.query.warehouseId;
        }
        const allocations = await WarehouseInventory.find(allocationQuery);

        // Compute allocations by productId
        const stockByProduct = {};
        allocations.forEach(alloc => {
            if (!alloc.productId) return;
            const pid = alloc.productId.toString();
            if (!stockByProduct[pid]) stockByProduct[pid] = 0;
            stockByProduct[pid] += alloc.stockQty;
        });

        const isRestrictedUser = req.user.role !== 'owner' && req.user.role !== 'super-admin';
        const isFilteredByWarehouse = (req.query.warehouseId && req.query.warehouseId !== 'all') || isRestrictedUser;
        const includedProductIds = new Set(); // track which products are already shown via InventoryItem

        // Process InventoryItem records first
        let result = [];
        itemsObj.forEach(item => {
            const pIds = productMap[item._id.toString()] || [];
            pIds.forEach(pid => includedProductIds.add(pid.toString()));

            let totalStock = 0;
            let hasAllocation = false;
            pIds.forEach(pId => {
                const pidStr = pId.toString();
                if (stockByProduct[pidStr] !== undefined) {
                    totalStock += stockByProduct[pidStr];
                    hasAllocation = true;
                }
            });

            if (hasAllocation) {
                item.stockQty = totalStock;
            }

            if (isFilteredByWarehouse) {
                if (hasAllocation) result.push(item);
            } else {
                result.push(item);
            }
        });

        // Now include Products that have warehouse stock but are NOT linked to any InventoryItem
        allProducts.forEach(p => {
            const pid = p._id.toString();
            if (includedProductIds.has(pid)) return; // already shown via InventoryItem
            if (!p.inventoryItemId) {
                // This product has no InventoryItem link - check if it has warehouse stock
                const whStock = stockByProduct[pid] || 0;
                const hasWarehouseStock = whStock > 0 || (p.warehouseStock && p.warehouseStock > 0);

                if (hasWarehouseStock || !isFilteredByWarehouse) {
                    const productObj = p.toObject();
                    productObj.stockQty = whStock || p.warehouseStock || 0;
                    if (isFilteredByWarehouse && !whStock) return; // skip if filtering by warehouse but no allocation
                    result.push(productObj);
                }
            }
        });

        res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
const getInventoryItem = async (req, res, next) => {
    try {
        const item = await InventoryItem.findOne({ _id: req.params.id, companyId: req.user.companyId }).populate('unit', 'name shortName');
        if (!item) {
            res.status(404);
            return next(new Error('Product not found'));
        }
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private
const createInventoryItem = async (req, res, next) => {
    try {
        const item = await InventoryItem.create({ ...req.body, companyId: req.user.companyId });
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private
const updateInventoryItem = async (req, res, next) => {
    try {
        const item = await InventoryItem.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!item) {
            res.status(404);
            return next(new Error('Inventory item not found'));
        }
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
const deleteInventoryItem = async (req, res, next) => {
    try {
        const item = await Product.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!item) {
            res.status(404);
            return next(new Error('Product not found'));
        }
        await item.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// @desc    Adjust stock for an inventory item
// @route   PUT /api/inventory/:id/adjust
// @access  Private
const adjustStock = async (req, res, next) => {
    try {
        const { type, quantity, expiryDate, manufacturedDate } = req.body; // type: 'add', 'subtract', 'set'
        const qty = Number(quantity);

        if (isNaN(qty)) {
            res.status(400);
            return next(new Error('Invalid quantity'));
        }

        const item = await Product.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!item) {
            res.status(404);
            return next(new Error('Product not found'));
        }

        if (type === 'add') {
            item.warehouseStock += qty;
        } else if (type === 'subtract') {
            item.warehouseStock -= qty;
        } else if (type === 'set') {
            item.warehouseStock = qty;
        } else {
            res.status(400);
            return next(new Error('Invalid adjustment type. Use add, subtract, or set.'));
        }

        if (item.warehouseStock < 0) {
            res.status(400);
            return next(new Error('Warehouse stock cannot be negative'));
        }

        if (req.body.batchNumber && item.batches) {
            const batchObj = item.batches.find(b => b.batchNumber === req.body.batchNumber);
            if (batchObj) {
                if (type === 'add') batchObj.quantity += qty;
                else if (type === 'subtract') batchObj.quantity -= qty;
                else if (type === 'set') batchObj.quantity = qty;

                // Update dates for this specific batch if provided
                if (expiryDate) batchObj.expiryDate = new Date(expiryDate);
                if (manufacturedDate) batchObj.manufacturedDate = new Date(manufacturedDate);
            }
        } else if (type === 'add') {
            // Create a new manual batch
            if (!item.batches) item.batches = [];
            const d = new Date();
            const newBatch = {
                batchNumber: `MANUAL-${d.getDate()}${d.getMonth() + 1}${d.getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                quantity: qty,
            };
            if (expiryDate) newBatch.expiryDate = new Date(expiryDate);
            if (manufacturedDate) newBatch.manufacturedDate = new Date(manufacturedDate);
            item.batches.push(newBatch);
        } else if (type === 'subtract' && !req.body.batchNumber) {
            // FIFO deduction if no batch specified
            let remainingToDeduct = qty;
            if (item.batches) {
                for (let i = 0; i < item.batches.length && remainingToDeduct > 0; i++) {
                    const b = item.batches[i];
                    if (b.quantity > 0) {
                        if (b.quantity >= remainingToDeduct) {
                            b.quantity -= remainingToDeduct;
                            remainingToDeduct = 0;
                        } else {
                            remainingToDeduct -= b.quantity;
                            b.quantity = 0;
                        }
                    }
                }
            }
        }

        await item.save();

        res.status(200).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all inventory items with batch/expiry tracking
// @route   GET /api/inventory/expired
// @access  Private
const getExpiredInventory = async (req, res, next) => {
    try {
        const products = await Product.find({ 'batches.0': { $exists: true }, companyId: req.user.companyId });

        let allBatches = [];
        products.forEach(p => {
            p.batches.forEach(b => {
                // Only include batches that have stock
                if (b.quantity > 0) {
                    allBatches.push({
                        ...p.toObject(),
                        warehouseStock: b.quantity, // Override with batch quantity
                        expiryDate: b.expiryDate,
                        manufacturedDate: b.manufacturedDate,
                        batchNumber: b.batchNumber
                    });
                }
            });
        });

        // Sort by expiry date ascending (nulls at end)
        allBatches.sort((a, b) => {
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;
            return new Date(a.expiryDate) - new Date(b.expiryDate);
        });

        res.status(200).json({ success: true, count: allBatches.length, data: allBatches });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInventoryItems,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustStock,
    getExpiredInventory,
};
