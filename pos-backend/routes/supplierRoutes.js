const express = require('express');
const router = express.Router();
const {
    getSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    addToCatalog,
    removeFromCatalog
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getSuppliers)
    .post(createSupplier);

router.route('/:id')
    .get(getSupplier)
    .put(updateSupplier)
    .delete(deleteSupplier); router.route('/:id/catalog')
        .post(addToCatalog);

router.route('/:id/catalog/:productId')
    .delete(removeFromCatalog);

module.exports = router;
