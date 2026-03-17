const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const WarehouseInventory = require('../models/WarehouseInventory');

// Internal helper to update stock when a purchase is delivered
const addPurchaseStock = async (purchase) => {
    purchase.deliveredAt = new Date();
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;

    for (let i = 0; i < purchase.items.length; i++) {
        const item = purchase.items[i];
        const prodItem = await Product.findById(item.product);
        if (prodItem) {
            // Update legacy global inventory and batches (if needed for backward compatibility)
            prodItem.warehouseStock = (prodItem.warehouseStock || 0) + Number(item.quantity);

            // Use assigned batch number or auto-generate
            const batchNum = item.batchNumber && item.batchNumber.trim() !== ''
                ? item.batchNumber.trim()
                : `BATCH-${dateStr}-${String(i + 1).padStart(3, '0')}`;

            // Push a new batch to the product
            if (!prodItem.batches) prodItem.batches = [];
            prodItem.batches.push({
                batchNumber: batchNum,
                quantity: Number(item.quantity)
            });

            await prodItem.save();

            // Update specific WarehouseInventory
            if (purchase.destinationWarehouseId) {
                let whInventory = await WarehouseInventory.findOne({
                    warehouseId: purchase.destinationWarehouseId,
                    productId: prodItem._id
                });

                if (whInventory) {
                    whInventory.stockQty += Number(item.quantity);
                    await whInventory.save();
                } else {
                    await WarehouseInventory.create({
                        warehouseId: purchase.destinationWarehouseId,
                        productId: prodItem._id,
                        stockQty: Number(item.quantity),
                        companyId: purchase.companyId
                    });
                }
            }
        }
    }
};

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
const getPurchases = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        let query = { companyId: req.user.companyId };
        if (storeId) {
            query.storeId = storeId;
        }

        const purchases = await Purchase.find(query)
            .populate('supplier', 'name')
            .populate('items.product', 'name')
            .populate('createdBy', 'name')
            .populate('destinationWarehouseId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: purchases.length, data: purchases });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private
const getPurchase = async (req, res, next) => {
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, companyId: req.user.companyId })
            .populate('supplier', 'name email phone address')
            .populate('items.product', 'name category')
            .populate('createdBy', 'name')
            .populate('destinationWarehouseId', 'name');

        if (!purchase) {
            res.status(404);
            return next(new Error('Purchase record not found'));
        }
        res.status(200).json({ success: true, data: purchase });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new purchase (Order placed — stock NOT updated yet)
// @route   POST /api/purchases
// @access  Private
const createPurchase = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        if (!storeId) {
            res.status(400);
            return next(new Error('Store context is required to create a purchase. Please select a store.'));
        }

        const { supplier, destinationWarehouseId, items, totalAmount, paidAmount, status, deliveryStatus, notes, expectedDeliveryDate } = req.body;

        if (!destinationWarehouseId) {
            res.status(400);
            return next(new Error('Destination warehouse is required'));
        }

        if (!items || items.length === 0) {
            res.status(400);
            return next(new Error('No items in purchase'));
        }

        // Validate all products exist
        const purchaseItems = [];
        for (const item of items) {
            const prodItem = await Product.findById(item.productId);
            if (!prodItem) {
                res.status(404);
                return next(new Error(`Product ${item.productId} not found`));
            }

            purchaseItems.push({
                product: prodItem._id,
                name: prodItem.name,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                total: Number(item.quantity) * Number(item.unitPrice),
                batchNumber: item.batchNumber || ''
            });
        }

        // Generate Invoice Number for Purchase (PO-timestamp)
        const invoiceNumber = `PO-${Date.now()}`;

        const purchase = await Purchase.create({
            supplier,
            items: purchaseItems,
            totalAmount,
            paidAmount,
            status, // paid, pending, partial (payment status)
            deliveryStatus: deliveryStatus || 'ordered', // delivery tracking
            expectedDeliveryDate: expectedDeliveryDate || undefined,
            invoiceNumber,
            notes,
            createdBy: req.user._id,
            storeId,
            destinationWarehouseId,
            companyId: req.user.companyId,
        });

        // If created as delivered, update stock immediately
        if (purchase.deliveryStatus === 'delivered') {
            await addPurchaseStock(purchase);
            await purchase.save();
        }

        // Update Supplier Pending Balance if payment is pending/partial
        if (status !== 'paid') {
            const supplierDoc = await Supplier.findById(supplier);
            if (supplierDoc) {
                supplierDoc.pendingPayment += (totalAmount - (paidAmount || 0));
                supplierDoc.totalOrders += 1;
                await supplierDoc.save();
            }
        } else {
            const supplierDoc = await Supplier.findById(supplier);
            if (supplierDoc) {
                supplierDoc.totalOrders += 1;
                await supplierDoc.save();
            }
        }

        res.status(201).json({ success: true, data: purchase });
    } catch (error) {
        next(error);
    }
};

// @desc    Update purchase (payment status, delivery status, paid amount, notes)
// @route   PUT /api/purchases/:id
// @access  Private (Owner only)
const updatePurchase = async (req, res, next) => {
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!purchase) {
            res.status(404);
            return next(new Error('Purchase not found'));
        }

        const { status, paidAmount, notes, deliveryStatus, expectedDeliveryDate } = req.body;
        const oldStatus = purchase.status;
        const oldPaidAmount = purchase.paidAmount || 0;
        const oldDeliveryStatus = purchase.deliveryStatus;

        // Payment fields
        if (status) purchase.status = status;
        if (paidAmount !== undefined) purchase.paidAmount = Number(paidAmount);
        if (notes !== undefined) purchase.notes = notes;
        if (expectedDeliveryDate !== undefined) purchase.expectedDeliveryDate = expectedDeliveryDate;

        // ---- Delivery Status Handling ----
        if (deliveryStatus && deliveryStatus !== oldDeliveryStatus) {
            // Prevent reverting from 'delivered'
            if (oldDeliveryStatus === 'delivered') {
                res.status(400);
                return next(new Error('Cannot change delivery status after order has been delivered'));
            }

            purchase.deliveryStatus = deliveryStatus;

            // If transitioning to 'delivered', update warehouse stock
            if (deliveryStatus === 'delivered') {
                await addPurchaseStock(purchase);
            }
        }

        await purchase.save();

        // Update supplier pending balance if payment status changed
        if (status && status !== oldStatus) {
            const supplierDoc = await Supplier.findById(purchase.supplier);
            if (supplierDoc) {
                if (oldStatus !== 'paid' && status === 'paid') {
                    supplierDoc.pendingPayment -= (purchase.totalAmount - oldPaidAmount);
                } else if (oldStatus === 'paid' && status !== 'paid') {
                    supplierDoc.pendingPayment += (purchase.totalAmount - (paidAmount || 0));
                } else {
                    const oldPending = purchase.totalAmount - oldPaidAmount;
                    const newPending = purchase.totalAmount - (paidAmount || 0);
                    supplierDoc.pendingPayment += (newPending - oldPending);
                }
                if (supplierDoc.pendingPayment < 0) supplierDoc.pendingPayment = 0;
                await supplierDoc.save();
            }
        }

        const updatedPurchase = await Purchase.findById(req.params.id)
            .populate('supplier', 'name')
            .populate('items.product', 'name')
            .populate('createdBy', 'name');

        res.status(200).json({ success: true, data: updatedPurchase });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete purchase (Rollback Stock only if delivered)
// @route   DELETE /api/purchases/:id
// @access  Private (Owner only)
const deletePurchase = async (req, res, next) => {
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!purchase) {
            res.status(404);
            return next(new Error('Purchase not found'));
        }

        // Only rollback warehouse stock if the order was actually delivered
        if (purchase.deliveryStatus === 'delivered') {
            const WarehouseInventory = require('../models/WarehouseInventory');
            for (const item of purchase.items) {
                const prodItem = await Product.findById(item.product);
                if (prodItem) {
                    prodItem.warehouseStock -= item.quantity;
                    if (prodItem.warehouseStock < 0) prodItem.warehouseStock = 0;

                    if (prodItem.batches && prodItem.batches.length > 0) {
                        let remainingToRemove = item.quantity;
                        for (let i = prodItem.batches.length - 1; i >= 0 && remainingToRemove > 0; i--) {
                            if (prodItem.batches[i].quantity <= remainingToRemove) {
                                remainingToRemove -= prodItem.batches[i].quantity;
                                prodItem.batches.splice(i, 1);
                            } else {
                                prodItem.batches[i].quantity -= remainingToRemove;
                                remainingToRemove = 0;
                            }
                        }
                    }

                    await prodItem.save();

                    // Rollback specific WarehouseInventory
                    if (purchase.destinationWarehouseId) {
                        let whInventory = await WarehouseInventory.findOne({
                            warehouseId: purchase.destinationWarehouseId,
                            productId: prodItem._id
                        });
                        if (whInventory) {
                            whInventory.stockQty -= item.quantity;
                            if (whInventory.stockQty < 0) whInventory.stockQty = 0;
                            await whInventory.save();
                        }
                    }
                }
            }
        }

        await purchase.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// @desc    Get supplier price comparison for all products
// @route   GET /api/purchases/price-comparison
// @access  Private
const getSupplierPriceComparison = async (req, res, next) => {
    try {
        // Get all purchases with supplier and product info
        const purchases = await Purchase.find({ companyId: req.user.companyId })
            .populate('supplier', 'name')
            .populate('items.product', 'name brand category');

        // Get all suppliers with their catalogs populated
        const suppliers = await Supplier.find({ companyId: req.user.companyId })
            .populate('catalog.product', 'name brand category');

        // Build: productId -> { productInfo, suppliers: { supplierId -> { name, latestPrice, avgPrice, totalQty, lastDate } } }
        const productMap = {};

        purchases.forEach(purchase => {
            const supplierName = purchase.supplier?.name || 'Unknown';
            const supplierId = purchase.supplier?._id?.toString() || 'unknown';
            const purchaseDate = purchase.createdAt;

            purchase.items.forEach(item => {
                const productId = item.product?._id?.toString() || item.name;
                const productName = item.product?.name || item.name;
                const productBrand = item.product?.brand || '';
                const productCategory = item.product?.category || '';

                if (!productMap[productId]) {
                    productMap[productId] = {
                        productId,
                        productName,
                        brand: productBrand,
                        category: productCategory,
                        suppliers: {}
                    };
                }

                if (!productMap[productId].suppliers[supplierId]) {
                    productMap[productId].suppliers[supplierId] = {
                        supplierName,
                        supplierId,
                        prices: [],
                        totalQty: 0,
                        lastDate: null
                    };
                }

                const supplierEntry = productMap[productId].suppliers[supplierId];
                supplierEntry.prices.push(item.unitPrice);
                supplierEntry.totalQty += item.quantity;
                if (!supplierEntry.lastDate || purchaseDate > supplierEntry.lastDate) {
                    supplierEntry.lastDate = purchaseDate;
                    supplierEntry.latestPrice = item.unitPrice;
                }
            });
        });

        // Merge manual catalogs
        suppliers.forEach(supplierDoc => {
            const supplierName = supplierDoc.name;
            const supplierId = supplierDoc._id.toString();

            supplierDoc.catalog.forEach(catalogItem => {
                if (!catalogItem.product) return; // skip if populated product is null

                const productId = catalogItem.product._id.toString();
                const productName = catalogItem.product.name;
                const productBrand = catalogItem.product.brand || '';
                const productCategory = catalogItem.product.category || '';

                if (!productMap[productId]) {
                    productMap[productId] = {
                        productId,
                        productName,
                        brand: productBrand,
                        category: productCategory,
                        suppliers: {}
                    };
                }

                if (!productMap[productId].suppliers[supplierId]) {
                    // Manual catalog only, no purchase history yet
                    productMap[productId].suppliers[supplierId] = {
                        supplierName,
                        supplierId,
                        prices: [],
                        totalQty: 0,
                        lastDate: null,
                        latestPrice: catalogItem.price // Base initial latest price off catalog
                    };
                } else {
                    // Purchase history exists. Override the 'latestPrice' IF the manual catalog was updated more recently than the last purchase, or just always use manual catalog quote as the "latest quoted price"?
                    // Actually, a manual catalog quote should act as the current definitive price. Let's just set latestPrice to catalog price if it exists.
                    productMap[productId].suppliers[supplierId].latestPrice = catalogItem.price;
                }
            });
        });

        // Convert to array and calculate avg prices + find cheapest
        const comparison = Object.values(productMap).map(product => {
            const supplierList = Object.values(product.suppliers).map(s => ({
                supplierName: s.supplierName,
                supplierId: s.supplierId,
                latestPrice: s.latestPrice,
                avgPrice: s.prices.reduce((a, b) => a + b, 0) / s.prices.length,
                totalQty: s.totalQty,
                lastDate: s.lastDate,
                purchaseCount: s.prices.length
            }));

            const cheapest = supplierList.reduce((min, s) => s.latestPrice < min.latestPrice ? s : min, supplierList[0]);

            return {
                productId: product.productId,
                productName: product.productName,
                brand: product.brand,
                category: product.category,
                supplierCount: supplierList.length,
                suppliers: supplierList.sort((a, b) => a.latestPrice - b.latestPrice),
                cheapestSupplier: cheapest?.supplierName,
                cheapestPrice: cheapest?.latestPrice
            };
        })
            .filter(p => p.supplierCount > 0)
            .sort((a, b) => b.supplierCount - a.supplierCount);

        res.status(200).json({ success: true, data: comparison });
    } catch (error) {
        next(error);
    }
};

// @desc    Get order tracking data (all purchases grouped by delivery status)
// @route   GET /api/purchases/tracking
// @access  Private
const getOrderTracking = async (req, res, next) => {
    try {
        const purchases = await Purchase.find({ companyId: req.user.companyId })
            .populate('supplier', 'name phone')
            .populate('items.product', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: purchases });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPurchases,
    getPurchase,
    createPurchase,
    updatePurchase,
    deletePurchase,
    getSupplierPriceComparison,
    getOrderTracking
};
