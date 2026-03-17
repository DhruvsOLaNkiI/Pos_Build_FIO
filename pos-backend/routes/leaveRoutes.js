const express = require('express');
const router = express.Router();
const {
    requestLeave,
    getLeaves,
    updateLeaveStatus,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .post(requestLeave)
    .get(getLeaves);

router.route('/:id').put(authorize('owner', 'manager'), updateLeaveStatus);

module.exports = router;
