const express = require('express');
const router = express.Router();
const {
    createSale,
    getSales,
    getSale,
    processReturn
} = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getSales)
    .post(authorize('owner', 'cashier'), createSale);

router.route('/:id')
    .get(getSale);

router.route('/:id/return')
    .put(authorize('owner', 'cashier'), processReturn);

module.exports = router;
