const ShopSettings = require('../models/ShopSettings');

// @desc    Get shop settings (creates default if none exist)
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        let settings = await ShopSettings.findOne({ companyId });

        // Create default settings if none exist for this company
        if (!settings) {
            settings = await ShopSettings.create({ companyId });
        }

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

// @desc    Update shop settings
// @route   PUT /api/settings
// @access  Private (Owner only)
const updateSettings = async (req, res, next) => {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            res.status(403);
            return next(new Error('Only the owner can update settings'));
        }

        const companyId = req.user.companyId;
        let settings = await ShopSettings.findOne({ companyId });

        if (!settings) {
            settings = await ShopSettings.create({ ...req.body, companyId });
        } else {
            // Update only the fields that are provided
            const allowedFields = [
                'shopName',
                'address',
                'phone',
                'email',
                'gstNumber',
                'defaultGST',
                'currency',
                'receiptHeader',
                'receiptFooter',
                'lowStockThreshold',
                'expiryAlertDays',
            ];

            allowedFields.forEach((field) => {
                if (req.body[field] !== undefined) {
                    settings[field] = req.body[field];
                }
            });

            await settings.save();
        }

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSettings,
    updateSettings,
};
