const express = require('express');
const router = express.Router();
const {
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    getTodayStatus,
    getAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/break-start', startBreak);
router.post('/break-end', endBreak);
router.get('/', getAttendance);
router.get('/today', authorize('owner', 'manager'), getTodayStatus);

module.exports = router;
