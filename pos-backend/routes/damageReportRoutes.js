const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDamageReports, createDamageReport, deleteDamageReport } = require('../controllers/damageReportController');

router.route('/')
    .get(protect, getDamageReports)
    .post(protect, createDamageReport);

router.route('/:id')
    .delete(protect, deleteDamageReport);

module.exports = router;
