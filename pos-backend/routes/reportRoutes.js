const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getSalesReport,
    getProfitLossReport,
    getGSTReport,
} = require('../controllers/reportController');

router.use(protect);

router.get('/sales', getSalesReport);
router.get('/profit-loss', getProfitLossReport);
router.get('/gst', getGSTReport);

module.exports = router;
