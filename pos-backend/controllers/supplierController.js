const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res, next) => {
    try {
        const suppliers = await Supplier.find({ companyId: req.user.companyId })
            .populate('catalog.product', 'name category brand variant')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: suppliers.length, data: suppliers });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.user.companyId })
            .populate('catalog.product', 'name category brand variant');
        if (!supplier) {
            res.status(404);
            return next(new Error('Supplier not found'));
        }
        res.status(200).json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private
const createSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.create({ ...req.body, companyId: req.user.companyId });
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = async (req, res, next) => {
    try {
        let supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!supplier) {
            res.status(404);
            return next(new Error('Supplier not found'));
        }

        supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
const deleteSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!supplier) {
            res.status(404);
            return next(new Error('Supplier not found'));
        }

        await supplier.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// @desc    Add product to supplier catalog
// @route   POST /api/suppliers/:id/catalog
// @access  Private
const addToCatalog = async (req, res, next) => {
    try {
        const { product, price } = req.body;

        let supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!supplier) {
            res.status(404);
            return next(new Error('Supplier not found'));
        }

        // Handle both single product ID and array of product IDs
        const productIds = Array.isArray(product) ? product : [product];

        productIds.forEach(prodId => {
            // Check if product already exists in catalog
            const existingIndex = supplier.catalog.findIndex(
                (item) => item.product.toString() === prodId.toString()
            );

            if (existingIndex !== -1) {
                // Update existing price and date
                supplier.catalog[existingIndex].price = price;
                supplier.catalog[existingIndex].lastUpdated = Date.now();
            } else {
                // Add new
                supplier.catalog.push({ product: prodId, price });
            }
        });

        await supplier.save();
        await supplier.populate('catalog.product', 'name category brand variant');

        // Return updated supplier
        res.status(200).json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove product from supplier catalog
// @route   DELETE /api/suppliers/:id/catalog/:productId
// @access  Private
const removeFromCatalog = async (req, res, next) => {
    try {
        let supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!supplier) {
            res.status(404);
            return next(new Error('Supplier not found'));
        }

        supplier.catalog = supplier.catalog.filter(
            (item) => item.product.toString() !== req.params.productId.toString()
        );

        await supplier.save();
        res.status(200).json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    addToCatalog,
    removeFromCatalog
};
