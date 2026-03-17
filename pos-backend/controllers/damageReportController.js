const DamageReport = require('../models/DamageReport');
const InventoryItem = require('../models/InventoryItem');

// @desc    Get all damage reports
// @route   GET /api/damage-reports
// @access  Private
const getDamageReports = async (req, res, next) => {
    try {
        const reports = await DamageReport.find({ companyId: req.user.companyId })
            .populate('inventoryItem', 'name barcode batchNumber')
            .populate('reportedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: reports.length, data: reports });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a damage report
// @route   POST /api/damage-reports
// @access  Private
const createDamageReport = async (req, res, next) => {
    try {
        const { inventoryItem, productName, batchNumber, damageType, quantity, description } = req.body;

        if (!description || !inventoryItem) {
            res.status(400);
            return next(new Error('Product and description are required'));
        }

        const report = await DamageReport.create({
            inventoryItem,
            productName,
            batchNumber: batchNumber || '',
            damageType: damageType || 'other',
            quantity: quantity || 1,
            description,
            reportedBy: req.user._id,
            companyId: req.user.companyId,
        });

        // Optionally reduce stock for damaged items
        if (quantity && quantity > 0) {
            const invItem = await InventoryItem.findById(inventoryItem);
            if (invItem) {
                invItem.stockQty = Math.max(0, invItem.stockQty - Number(quantity));
                await invItem.save();
            }
        }

        res.status(201).json({ success: true, data: report });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a damage report
// @route   DELETE /api/damage-reports/:id
// @access  Private
const deleteDamageReport = async (req, res, next) => {
    try {
        const report = await DamageReport.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!report) {
            res.status(404);
            return next(new Error('Damage report not found'));
        }
        await report.deleteOne();
        res.status(200).json({ success: true, message: 'Damage report deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDamageReports, createDamageReport, deleteDamageReport };
