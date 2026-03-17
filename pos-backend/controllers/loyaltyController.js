const LoyaltySettings = require('../models/LoyaltySettings');
const Offer = require('../models/Offer');

// ===== LOYALTY SETTINGS =====

// GET /api/loyalty/settings
const getLoyaltySettings = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        let settings = await LoyaltySettings.findOne({ storeId, companyId: req.user.companyId });
        if (!settings) {
            // Auto-create defaults
            settings = await LoyaltySettings.create({ storeId, companyId: req.user.companyId });
        }
        res.json({ success: true, data: settings });
    } catch (err) { next(err); }
};

// PUT /api/loyalty/settings
const updateLoyaltySettings = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        const { pointsPerRupee, rupeeValuePerPoint, minPointsToRedeem, maxRedeemPercentage, isEnabled } = req.body;
        const settings = await LoyaltySettings.findOneAndUpdate(
            { storeId, companyId: req.user.companyId },
            { pointsPerRupee, rupeeValuePerPoint, minPointsToRedeem, maxRedeemPercentage, isEnabled },
            { new: true, upsert: true }
        );
        res.json({ success: true, data: settings });
    } catch (err) { next(err); }
};

// ===== OFFERS =====

// GET /api/loyalty/offers
const getOffers = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        const offers = await Offer.find({ storeId, companyId: req.user.companyId }).sort({ createdAt: -1 });
        res.json({ success: true, data: offers });
    } catch (err) { next(err); }
};

// POST /api/loyalty/offers
const createOffer = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        if (!storeId) { res.status(400); return next(new Error('Store context required')); }
        const offer = await Offer.create({ ...req.body, storeId, companyId: req.user.companyId });
        res.status(201).json({ success: true, data: offer });
    } catch (err) { next(err); }
};

// PUT /api/loyalty/offers/:id
const updateOffer = async (req, res, next) => {
    try {
        const offer = await Offer.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            req.body,
            { new: true }
        );
        if (!offer) { res.status(404); return next(new Error('Offer not found')); }
        res.json({ success: true, data: offer });
    } catch (err) { next(err); }
};

// DELETE /api/loyalty/offers/:id
const deleteOffer = async (req, res, next) => {
    try {
        const offer = await Offer.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
        if (!offer) { res.status(404); return next(new Error('Offer not found')); }
        res.json({ success: true, message: 'Offer deleted' });
    } catch (err) { next(err); }
};

// POST /api/loyalty/offers/validate — used at billing to validate a coupon code
const validateCoupon = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        const { couponCode, cartTotal } = req.body;
        const now = new Date();

        const offer = await Offer.findOne({
            storeId,
            companyId: req.user.companyId,
            isActive: true,
            couponCode: couponCode.toUpperCase().trim(),
            $and: [
                { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
                { $or: [{ validTo: null }, { validTo: { $gte: now } }] },
            ],
        });

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
        }
        if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
            return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
        }
        if (cartTotal < offer.minPurchaseAmount) {
            return res.status(400).json({ success: false, message: `Minimum purchase of ₹${offer.minPurchaseAmount} required` });
        }

        let discountAmount = 0;
        if (offer.type === 'percentage') {
            discountAmount = (cartTotal * offer.discountValue) / 100;
            if (offer.maxDiscountAmount) discountAmount = Math.min(discountAmount, offer.maxDiscountAmount);
        } else if (offer.type === 'flat') {
            discountAmount = offer.discountValue;
        }

        res.json({ success: true, data: { offer, discountAmount } });
    } catch (err) { next(err); }
};

module.exports = { getLoyaltySettings, updateLoyaltySettings, getOffers, createOffer, updateOffer, deleteOffer, validateCoupon };
