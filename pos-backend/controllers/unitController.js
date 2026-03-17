const Unit = require('../models/Unit');
const Product = require('../models/Product');

// @desc    Get all units
// @route   GET /api/units
// @access  Private
const getUnits = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const units = await Unit.find({ companyId }).sort({ createdAt: -1 }).lean();

        // Count products for each unit (scoped to company)
        const unitsWithCounts = await Promise.all(
            units.map(async (unit) => {
                const count = await Product.countDocuments({ unit: unit._id, companyId });
                return {
                    ...unit,
                    noOfProducts: count
                };
            })
        );

        res.status(200).json({ success: true, count: unitsWithCounts.length, data: unitsWithCounts });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single unit
// @route   GET /api/units/:id
// @access  Private
const getUnit = async (req, res, next) => {
    try {
        const unit = await Unit.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!unit) {
            res.status(404);
            return next(new Error('Unit not found'));
        }
        res.status(200).json({ success: true, data: unit });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new unit
// @route   POST /api/units
// @access  Private (Admin/Owner)
const createUnit = async (req, res, next) => {
    try {
        const unit = await Unit.create({
            ...req.body,
            companyId: req.user.companyId,
        });
        res.status(201).json({ success: true, data: unit });
    } catch (error) {
        next(error);
    }
};

// @desc    Update unit
// @route   PUT /api/units/:id
// @access  Private
const updateUnit = async (req, res, next) => {
    try {
        let unit = await Unit.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!unit) {
            res.status(404);
            return next(new Error('Unit not found'));
        }

        unit = await Unit.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: unit });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete unit
// @route   DELETE /api/units/:id
// @access  Private
const deleteUnit = async (req, res, next) => {
    try {
        const unit = await Unit.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!unit) {
            res.status(404);
            return next(new Error('Unit not found'));
        }

        await unit.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUnits,
    getUnit,
    createUnit,
    updateUnit,
    deleteUnit
};
