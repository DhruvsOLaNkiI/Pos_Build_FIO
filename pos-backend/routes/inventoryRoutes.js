const express = require('express');
const router = express.Router();
const {
    getInventoryItems,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustStock,
    getExpiredInventory,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

// Get expired items route (Must be before /:id)
router.get('/expired', protect, getExpiredInventory);

router.route('/')
    .get(protect, getInventoryItems)
    .post(protect, createInventoryItem);

router.route('/:id')
    .get(protect, getInventoryItem)
    .put(protect, updateInventoryItem)
    .delete(protect, deleteInventoryItem);

router.route('/:id/adjust')
    .put(protect, adjustStock);

module.exports = router;
