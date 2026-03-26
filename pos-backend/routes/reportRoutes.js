const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getSalesReport,
    getProfitLossReport,
    getGSTReport,
    getGISReport,
} = require('../controllers/reportController');

router.use(protect);

router.get('/sales', getSalesReport);
router.get('/profit-loss', getProfitLossReport);
router.get('/gst', getGSTReport);
router.get('/gis', getGISReport);

module.exports = router;
