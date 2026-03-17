const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getLoyaltySettings, updateLoyaltySettings,
    getOffers, createOffer, updateOffer, deleteOffer, validateCoupon
} = require('../controllers/loyaltyController');

router.use(protect);

// Loyalty Settings
router.route('/settings')
    .get(getLoyaltySettings)
    .put(authorize('owner'), updateLoyaltySettings);

// Offers — NOTE: specific routes MUST come before /:id parameterized routes
router.route('/offers')
    .get(getOffers)
    .post(authorize('owner'), createOffer);

// validate coupon — must be before /offers/:id
router.post('/offers/validate', validateCoupon);

router.route('/offers/:id')
    .put(authorize('owner'), updateOffer)
    .delete(authorize('owner'), deleteOffer);

module.exports = router;
