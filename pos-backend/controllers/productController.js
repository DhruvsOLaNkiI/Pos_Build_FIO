const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const WarehouseInventory = require('../models/WarehouseInventory');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];

        let query = {};
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }

        if (storeId) {
            query.storeId = storeId;
        }

        const products = await Product.find(query).populate('unit').sort({ createdAt: -1 });

        // Fetch all warehouse inventories to attach to products (scoped to company)
        const inventoryQuery = req.user.role !== 'super-admin' ? { companyId: req.user.companyId } : {};
        const inventories = await WarehouseInventory.find(inventoryQuery).populate('warehouseId', 'name');

        // Group inventories by productId
        const inventoryMap = {};
        inventories.forEach(inv => {
            if (!inv.productId) return;
            const pid = inv.productId.toString();
            if (!inventoryMap[pid]) inventoryMap[pid] = [];
            if (inv.warehouseId) {
                inventoryMap[pid].push({
                    warehouseId: inv.warehouseId._id,
                    warehouseName: inv.warehouseId.name,
                    stockQty: inv.stockQty
                });
            }
        });

        const productsWithAllocations = products.map(p => {
            const pObj = p.toObject();
            pObj.allocations = inventoryMap[p._id.toString()] || [];
            return pObj;
        });

        res.status(200).json({ success: true, count: productsWithAllocations.length, data: productsWithAllocations });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res, next) => {
    try {
        let query = { _id: req.params.id };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        const product = await Product.findOne(query).populate('unit');
        if (!product) {
            res.status(404);
            return next(new Error('Product not found'));
        }
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin/Owner)
const createProduct = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        if (!storeId) {
            res.status(400);
            return next(new Error('Store context is required to create a product. Please select a store.'));
        }

        const productData = { ...req.body, storeId };
        
        if (req.user.role !== 'super-admin' || !productData.companyId) {
            productData.companyId = req.user.companyId;
        }

        // Handle empty barcode to prevent unique constraint duplicate key errors
        if (productData.barcode === '') {
            productData.barcode = undefined;
        }

        // Sanitize empty ObjectId fields sent as empty strings from FormData
        if (!productData.unit || productData.unit === '') {
            delete productData.unit;
        }
        if (!productData.inventoryItemId || productData.inventoryItemId === '') {
            delete productData.inventoryItemId;
        }
        if (!productData.destinationWarehouseId || productData.destinationWarehouseId === '') {
            delete productData.destinationWarehouseId;
        }

        // Handle single image upload (legacy)
        if (req.file) {
            productData.imageUrl = `/uploads/${req.file.filename}`;
            productData.imageUrls = [`/uploads/${req.file.filename}`];
        }

        // Handle multiple image uploads
        if (req.files && req.files.length > 0) {
            const imagePathList = req.files.map(f => `/uploads/${f.filename}`);
            productData.imageUrls = imagePathList;
            productData.imageUrl = imagePathList[0]; // backward compat: first image is primary
        }

        // Handle Inventory linking and stock deduction
        if (productData.inventoryItemId && productData.stockQty && Number(productData.stockQty) > 0) {
            const qtyToDeduct = Number(productData.stockQty);
            const invItem = await InventoryItem.findById(productData.inventoryItemId);

            if (!invItem) {
                res.status(404);
                return next(new Error('Linked Warehouse Inventory item not found.'));
            }

            if (invItem.stockQty < qtyToDeduct) {
                res.status(400);
                return next(new Error(`Insufficient stock in Warehouse for ${invItem.name}. Available: ${invItem.stockQty}, Requested: ${qtyToDeduct}`));
            }

            // Deduct stock from warehouse
            invItem.stockQty -= qtyToDeduct;
            await invItem.save();
        }

        let shopStock = Number(productData.stockQty) || 0;
        let warehouseStockAssignment = 0;

        // Route stock correctly to either Warehouse OR Shop to prevent phantom duplication
        if (productData.destinationWarehouseId && shopStock > 0) {
            warehouseStockAssignment = shopStock;
            shopStock = 0; // The stock goes to the warehouse, not the shop floor
        }

        productData.stockQty = shopStock;

        const product = await Product.create(productData);

        // Always create a WarehouseInventory record so the product is tracked
        let targetWarehouseId = productData.destinationWarehouseId;
        if (!targetWarehouseId) {
            // First, check the current store's default warehouse
            const Store = require('../models/Store');
            const storeId = req.headers['x-store-id'];
            if (storeId) {
                const currentStore = await Store.findById(storeId);
                if (currentStore?.defaultWarehouseId) {
                    targetWarehouseId = currentStore.defaultWarehouseId;
                }
            }
            // Fall back to the global default warehouse for this company
            if (!targetWarehouseId) {
                const Warehouse = require('../models/Warehouse');
                const defaultWh = await Warehouse.findOne({ isDefault: true, companyId: productData.companyId });
                if (defaultWh) targetWarehouseId = defaultWh._id;
            }
        }

        if (targetWarehouseId) {
            let warehouseInvData = {
                warehouseId: targetWarehouseId,
                productId: product._id,
                stockQty: warehouseStockAssignment
            };
            if (req.user.role !== 'super-admin' || !req.body.companyId) {
                warehouseInvData.companyId = req.user.companyId;
            } else {
                warehouseInvData.companyId = req.body.companyId;
            }

            await WarehouseInventory.create(warehouseInvData);
        }

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
    try {
        let query = { _id: req.params.id };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        let product = await Product.findOne(query);
        if (!product) {
            res.status(404);
            return next(new Error('Product not found'));
        }

        const updateData = { ...req.body };

        // Prevent arbitrary manual stock overrides from basic product edits.
        // Stock should ONLY be updated via explicit Inventory adjustments, Purchase Orders, or Transfers.
        if ('stockQty' in updateData) {
            delete updateData.stockQty;
        }
        if ('warehouseStock' in updateData) {
            delete updateData.warehouseStock;
        }

        // Process Stock Transfer from Warehouse to Shop
        if (req.body.transferQty) {
            const transferQty = Number(req.body.transferQty);
            const sourceWarehouseId = req.body.sourceWarehouseId;

            if (transferQty > 0) {
                let query = { productId: product._id };
                if (sourceWarehouseId) {
                    query.warehouseId = sourceWarehouseId;
                }
                const inventories = await WarehouseInventory.find(query).sort({ stockQty: -1 });
                const totalWhStock = inventories.reduce((sum, inv) => sum + inv.stockQty, 0);

                if (totalWhStock >= transferQty) {
                    let remainingToDeduct = transferQty;

                    for (const inv of inventories) {
                        if (remainingToDeduct === 0) break;

                        if (inv.stockQty >= remainingToDeduct) {
                            inv.stockQty -= remainingToDeduct;
                            remainingToDeduct = 0;
                        } else {
                            remainingToDeduct -= inv.stockQty;
                            inv.stockQty = 0;
                        }
                        await inv.save();
                    }

                    // Remove warehouseStock from being explicitly set on the Product model
                    updateData.stockQty = (product.stockQty || 0) + transferQty;

                    // Support Batch Deduction (FIFO)
                    if (product.batches && product.batches.length > 0) {
                        // Sort by manufacturedDate or createdAt to ensure oldest first
                        product.batches.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                        let remainingToTransfer = transferQty;
                        for (let i = 0; i < product.batches.length && remainingToTransfer > 0; i++) {
                            const b = product.batches[i];
                            if (b.quantity > 0) {
                                if (b.quantity >= remainingToTransfer) {
                                    b.quantity -= remainingToTransfer;
                                    remainingToTransfer = 0;
                                } else {
                                    remainingToTransfer -= b.quantity;
                                    b.quantity = 0;
                                }
                            }
                        }
                        updateData.batches = product.batches;
                    }
                } else {
                    res.status(400);
                    return next(new Error('Insufficient warehouse stock for transfer'));
                }
            }
        }

        // Fix empty barcode preventing update due to duplicate key
        if (updateData.barcode === '') {
            updateData.barcode = undefined;
            updateData.$unset = { barcode: 1 };
        }

        // Handle optional image update
        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        product = await Product.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).populate('unit');

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res, next) => {
    try {
        let query = { _id: req.params.id };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        const product = await Product.findOne(query);
        if (!product) {
            res.status(404);
            return next(new Error('Product not found'));
        }

        await product.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk update prices
// @route   POST /api/products/bulk-update-price
// @access  Private (Owner only)
const bulkUpdatePrice = async (req, res, next) => {
    try {
        const { category, percentage, type } = req.body; // type: 'increase' or 'decrease'
        const factor = type === 'increase' ? (1 + percentage / 100) : (1 - percentage / 100);

        let query = category ? { category } : {};
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }

        const products = await Product.find(query);

        const updatePromises = products.map(p => {
            p.sellingPrice = Math.round(p.sellingPrice * factor * 100) / 100;
            return p.save();
        });

        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: `Updated ${products.length} products successfully`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk delete products
// @route   DELETE /api/products/bulk
// @access  Private (Owner/Staff)
const bulkDeleteProducts = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400);
            return next(new Error('Please provide an array of product IDs to delete'));
        }

        // Ensure all products exist before deleting and belong to the correct company
        let delQuery = { _id: { $in: ids } };
        if (req.user.role !== 'super-admin') {
            delQuery.companyId = req.user.companyId;
        }
        const productsCount = await Product.countDocuments(delQuery);
        if (productsCount !== ids.length) {
            console.warn(`Attempted to bulk delete ${ids.length} products, but only found ${productsCount}. Proceeding anyway.`);
        }

        await Product.deleteMany(delQuery);

        res.status(200).json({
            success: true,
            message: `Successfully deleted ${productsCount} products`
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpdatePrice,
    bulkDeleteProducts
};
