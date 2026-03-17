const express = require('express');
const {
    getWarehouses,
    getWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
} = require('../controllers/warehouseController');

const {
    getWarehouseInventory,
    allocateStock,
    transferStock,
    removeWarehouseInventory
} = require('../controllers/warehouseInventoryController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getWarehouses)
    .post(protect, authorize('owner'), createWarehouse);

// Transfer route must come before /:id to prevent matching issues
router.route('/transfer')
    .post(protect, authorize('owner', 'manager'), transferStock);

router.route('/:id')
    .get(protect, getWarehouse)
    .put(protect, authorize('owner'), updateWarehouse)
    .delete(protect, authorize('owner'), deleteWarehouse);

// Nested routes for inventory
router.route('/:warehouseId/inventory')
    .get(protect, getWarehouseInventory)
    .post(protect, authorize('owner', 'manager'), allocateStock);

router.route('/:warehouseId/inventory/:id')
    .delete(protect, authorize('owner', 'manager'), removeWarehouseInventory);

module.exports = router;
