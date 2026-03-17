const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const WarehouseInventory = require('../models/WarehouseInventory');

router.use(protect);

router.get('/', async (req, res, next) => {
    try {
        const data = await WarehouseInventory.find()
            .populate('warehouseId', 'name')
            .populate('productId', 'name imageUrl sellingPrice');
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

module.exports = router;
