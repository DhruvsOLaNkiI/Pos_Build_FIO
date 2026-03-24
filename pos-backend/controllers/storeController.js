const Store = require('../models/Store');
const { geocodePincode } = require('../utils/geocoder');

// @desc    Get all stores
// @route   GET /api/stores
// @access  Private
exports.getStores = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }

        if (req.user.role !== 'owner' && req.user.role !== 'super-admin') {
            const User = require('../models/User');
            const user = await User.findById(req.user.id);
            if (user && user.accessibleStores && user.accessibleStores.length > 0) {
                query._id = { $in: user.accessibleStores };
            } else {
                return res.status(200).json({ success: true, count: 0, data: [] });
            }
        }
        const stores = await Store.find(query).populate('manager', 'name email');
        res.status(200).json({ success: true, count: stores.length, data: stores });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single store
// @route   GET /api/stores/:id
// @access  Private
exports.getStore = async (req, res) => {
    try {
        let query = { _id: req.params.id };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        const store = await Store.findOne(query).populate('manager', 'name email');
        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }
        res.status(200).json({ success: true, data: store });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create new store
// @route   POST /api/stores
// @access  Private (Owner only)
exports.createStore = async (req, res) => {
    try {
        if (req.user.role !== 'owner' && req.user.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to create stores' });
        }

        const { code, isDefault } = req.body;

        if (req.user.role !== 'super-admin' || !req.body.companyId) {
            req.body.companyId = req.user.companyId;
        }

        // Prevent duplicate code per company
        const existingCode = await Store.findOne({ code: code.toUpperCase(), companyId: req.body.companyId });
        if (existingCode) {
            return res.status(400).json({ success: false, message: 'Store code already exists for this company' });
        }

        // If this is the first store for company, always make it default
        const count = await Store.countDocuments({ companyId: req.body.companyId });
        if (count === 0) {
            req.body.isDefault = true;
        } else if (isDefault) {
            // If making this new store the default, remove default from others
            await Store.updateMany({ companyId: req.body.companyId }, { isDefault: false });
        }

        req.body.code = req.body.code.toUpperCase();

        // Use explicit lat/lng from map picker if provided, otherwise geocode from pincode
        if (req.body.latitude && req.body.longitude) {
            req.body.location = {
                type: 'Point',
                coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
            };
        } else if (req.body.pincode) {
            const coords = await geocodePincode(req.body.pincode);
            if (coords) {
                req.body.location = {
                    type: 'Point',
                    coordinates: [coords.lng, coords.lat]
                };
            }
        }

        const store = await Store.create(req.body);

        res.status(201).json({ success: true, data: store });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private (Owner only)
exports.updateStore = async (req, res) => {
    try {
        if (req.user.role !== 'owner' && req.user.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update stores' });
        }

        let query = { _id: req.params.id };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        let store = await Store.findOne(query);

        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        if (req.body.isDefault && !store.isDefault) {
            await Store.updateMany({ companyId: store.companyId }, { isDefault: false });
        } else if (store.isDefault && req.body.isDefault === false) {
            const count = await Store.countDocuments({ companyId: store.companyId });
            if (count > 1) {
                return res.status(400).json({ success: false, message: 'Cannot remove default status. You must set another store as default first.' });
            }
        }

        if (req.body.code) req.body.code = req.body.code.toUpperCase();

        // Use explicit lat/lng from map picker if provided, otherwise re-geocode from pincode
        if (req.body.latitude && req.body.longitude) {
            req.body.location = {
                type: 'Point',
                coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
            };
        } else if (req.body.pincode && req.body.pincode !== store.pincode) {
            const coords = await geocodePincode(req.body.pincode);
            if (coords) {
                req.body.location = {
                    type: 'Point',
                    coordinates: [coords.lng, coords.lat]
                };
            }
        }

        store = await Store.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: store });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Store code already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete store
// @route   DELETE /api/stores/:id
// @access  Private (Owner only)
exports.deleteStore = async (req, res) => {
    try {
        if (req.user.role !== 'owner' && req.user.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete stores' });
        }

        let query = { _id: req.params.id };
        if (req.user.role !== 'super-admin') {
            query.companyId = req.user.companyId;
        }
        const store = await Store.findOne(query);

        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        if (store.isDefault) {
            return res.status(400).json({ success: false, message: 'Cannot delete the default store. Set a different store as default first.' });
        }

        await store.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
