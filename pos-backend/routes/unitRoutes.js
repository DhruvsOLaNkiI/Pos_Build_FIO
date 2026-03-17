const express = require('express');
const router = express.Router();
const {
    getUnits,
    getUnit,
    createUnit,
    updateUnit,
    deleteUnit
} = require('../controllers/unitController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Optional: admin only for units

router.route('/')
    .get(protect, getUnits)
    .post(protect, authorize('owner'), createUnit); // Only admins/owners can create units

router.route('/:id')
    .get(protect, getUnit)
    .put(protect, authorize('owner'), updateUnit)
    .delete(protect, authorize('owner'), deleteUnit);

module.exports = router;
