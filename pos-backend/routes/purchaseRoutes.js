const express = require('express');
const router = express.Router();
const {
    getPurchases,
    getPurchase,
    createPurchase,
    updatePurchase,
    deletePurchase,
    getSupplierPriceComparison,
    getOrderTracking
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/tracking', getOrderTracking);
router.get('/price-comparison', getSupplierPriceComparison);

router.route('/')
    .get(getPurchases)
    .post(createPurchase);

router.route('/:id')
    .get(getPurchase)
    .put(authorize('owner'), updatePurchase)
    .delete(authorize('owner'), deletePurchase);

module.exports = router;


