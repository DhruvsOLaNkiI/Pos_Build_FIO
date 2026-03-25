const BannerConfig = require('../models/BannerConfig');

// @desc    Get banners for customer portal (public)
// @route   GET /api/banners
// @access  Public
exports.getBanners = async (req, res) => {
    try {
        const { companyId, storeId, section } = req.query;
        
        // Build base query
        const query = { isActive: true };
        
        if (companyId) query.company = companyId;
        if (storeId) query.store = storeId;
        if (section) query.section = section;

        // Fetch matching active banners and sort by updated
        const banners = await BannerConfig.find(query)
            .sort({ updatedAt: -1 })
            .populate('company', 'name')
            .populate('store', 'name');

        res.status(200).json({ success: true, data: banners });
    } catch (error) {
        console.error('Error in getBanners:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all banners (Admin/Owner)
// @route   GET /api/banners/admin
// @access  Private (Owner/SuperAdmin)
exports.adminGetBanners = async (req, res) => {
    try {
        const query = {};
        
        // If owner, restrict to their company
        if (req.user.role === 'owner') {
            query.company = req.user.company;
        }

        const banners = await BannerConfig.find(query)
            .sort({ createdAt: -1 })
            .populate('company', 'name')
            .populate('store', 'name')
            .populate('createdBy', 'name');

        res.status(200).json({ success: true, data: banners });
    } catch (error) {
        console.error('Error in adminGetBanners:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create banner config
// @route   POST /api/banners
// @access  Private (Owner/SuperAdmin)
exports.createBanner = async (req, res) => {
    try {
        const { company, store, section, layoutType, items, isActive } = req.body;

        // Ensure proper company affiliation mapping context
        let targetCompany = req.body.company;
        if (req.user.role === 'owner') {
            targetCompany = req.user.company; // Force to their own company
        }

        if (!targetCompany) {
            return res.status(400).json({ success: false, message: 'Company is required' });
        }

        const newBanner = await BannerConfig.create({
            company: targetCompany,
            store: store || null,
            section,
            layoutType,
            items: items || [],
            isActive: isActive !== undefined ? isActive : true,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, data: newBanner });
    } catch (error) {
        console.error('Error in createBanner:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update banner config
// @route   PUT /api/banners/:id
// @access  Private (Owner/SuperAdmin)
exports.updateBanner = async (req, res) => {
    try {
        let banner = await BannerConfig.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        // Authorization check
        if (req.user.role === 'owner' && banner.company.toString() !== req.user.company.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this banner' });
        }

        const updateData = req.body;
        // Owners cannot change the company
        if (req.user.role === 'owner') {
            delete updateData.company;
        }

        banner = await BannerConfig.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: banner });
    } catch (error) {
        console.error('Error in updateBanner:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete banner config
// @route   DELETE /api/banners/:id
// @access  Private (Owner/SuperAdmin)
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await BannerConfig.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        // Authorization check
        if (req.user.role === 'owner' && banner.company.toString() !== req.user.company.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this banner' });
        }

        await banner.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error('Error in deleteBanner:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
