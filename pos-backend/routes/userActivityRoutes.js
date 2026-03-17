const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    trackActivity,
    updateActivityDuration
} = require('../controllers/userActivityController');

// All routes require authentication
router.use(protect);

// Track user activity (page visit, product view, etc.)
router.post('/track', trackActivity);

// Update activity duration when user leaves page
router.put('/:id/duration', updateActivityDuration);

module.exports = router;
