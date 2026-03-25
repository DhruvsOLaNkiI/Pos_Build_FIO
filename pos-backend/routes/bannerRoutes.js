const express = require('express');
const {
    getBanners,
    adminGetBanners,
    createBanner,
    updateBanner,
    deleteBanner
} = require('../controllers/bannerController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route for customer portal
router.get('/', getBanners);

// Protected routes for Admin/Owner
router.get('/admin', protect, authorize('owner', 'super-admin'), adminGetBanners);

router.post('/', protect, authorize('owner', 'super-admin'), createBanner);
router.put('/:id', protect, authorize('owner', 'super-admin'), updateBanner);
router.delete('/:id', protect, authorize('owner', 'super-admin'), deleteBanner);

module.exports = router;
