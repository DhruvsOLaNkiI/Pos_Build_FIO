const express = require('express');
const router = express.Router();
const Register = require('../models/Register');
const RegisterSession = require('../models/RegisterSession');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all registers for a store
// @route   GET /api/registers?storeId=...
// @access  Private
router.get('/', protect, async (req, res, next) => {
    try {
        const { storeId } = req.query;
        if (!storeId) {
            res.status(400);
            return next(new Error('storeId is required'));
        }

        const registers = await Register.find({ storeId, companyId: req.user.companyId })
            .populate('assignedCashier', 'name')
            .sort({ name: 1 });
            
        // Get active sessions for these registers
        const activeSessions = await RegisterSession.find({
            storeId,
            status: 'open'
        }).populate('cashierId', 'name');

        const sessionMap = {};
        activeSessions.forEach(session => {
            sessionMap[session.registerId.toString()] = session;
        });

        const data = registers.map(reg => {
            const r = reg.toObject();
            r.activeSession = sessionMap[r._id.toString()] || null;
            return r;
        });

        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        next(error);
    }
});

// @desc    Create a new register
// @route   POST /api/registers
// @access  Private
router.post('/', protect, async (req, res, next) => {
    try {
        const { name, storeId, assignedCashier } = req.body;
        
        let register = await Register.findOne({ name, storeId });
        if (register) {
            res.status(400);
            return next(new Error('A register with this name already exists in this store'));
        }

        register = await Register.create({
            name,
            storeId,
            companyId: req.user.companyId,
            assignedCashier: assignedCashier || null
        });

        register = await register.populate('assignedCashier', 'name');

        res.status(201).json({ success: true, data: register });
    } catch (error) {
        next(error);
    }
});

// @desc    Update register
// @route   PUT /api/registers/:id
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
    try {
        let register = await Register.findById(req.params.id);
        if (!register) {
            res.status(404);
            return next(new Error('Register not found'));
        }

        register = await Register.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('assignedCashier', 'name');

        res.status(200).json({ success: true, data: register });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete/Deactivate register
// @route   DELETE /api/registers/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const register = await Register.findById(req.params.id);
        if (!register) {
            res.status(404);
            return next(new Error('Register not found'));
        }
        
        // Check if there's an open session
        const openSession = await RegisterSession.findOne({ registerId: req.params.id, status: 'open' });
        if (openSession) {
            res.status(400);
            return next(new Error('Cannot delete register while it has an open session. Please close the session first.'));
        }

        await Register.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
});

// ==========================================
// SESSION MANAGEMENT
// ==========================================

// @desc    Open a new register session
// @route   POST /api/registers/:id/open-session
// @access  Private
router.post('/:id/open-session', protect, async (req, res, next) => {
    try {
        const { openingBalance, deviceInfo } = req.body;
        const registerId = req.params.id;

        const register = await Register.findById(registerId);
        if (!register) {
            res.status(404);
            return next(new Error('Register not found'));
        }

        // Check for existing open session
        const activeSession = await RegisterSession.findOne({ registerId, status: 'open' });
        if (activeSession) {
            res.status(400);
            return next(new Error('This register already has an open session'));
        }

        // Update device info
        if (deviceInfo) {
            register.deviceInfo = deviceInfo;
            await register.save();
        }

        const session = await RegisterSession.create({
            registerId,
            cashierId: req.user._id,
            storeId: register.storeId,
            companyId: register.companyId,
            openingBalance: openingBalance || 0,
            status: 'open'
        });

        res.status(201).json({ success: true, data: session });
    } catch (error) {
        next(error);
    }
});

// @desc    Close a register session
// @route   POST /api/registers/:id/close-session
// @access  Private
router.post('/:id/close-session', protect, async (req, res, next) => {
    try {
        const { actualBalance, note } = req.body;
        const registerId = req.params.id;

        const session = await RegisterSession.findOne({ registerId, status: 'open' });
        if (!session) {
            res.status(400);
            return next(new Error('No open session found for this register'));
        }

        session.status = 'closed';
        session.closedAt = Date.now();
        session.actualBalance = actualBalance;
        
        if (note) {
            session.transactions.push({
                type: 'payout', // Just using payout as a generic note type for closing
                amount: 0,
                note: `Session Closed Note: ${note}`,
                timestamp: Date.now()
            });
        }

        await session.save(); // Will calculate expected balance and difference due to pre-save hook

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        next(error);
    }
});

// @desc    Add cash (pay in) or remove cash (pay out)
// @route   POST /api/registers/:id/cash-movement
// @access  Private
router.post('/:id/cash-movement', protect, async (req, res, next) => {
    try {
        const { type, amount, note } = req.body; // type: 'payin' | 'payout'
        const registerId = req.params.id;

        if (!['payin', 'payout'].includes(type)) {
            res.status(400);
            return next(new Error('Invalid movement type'));
        }

        if (!amount || amount <= 0) {
            res.status(400);
            return next(new Error('Please provide a valid amount'));
        }

        const session = await RegisterSession.findOne({ registerId, status: 'open' });
        if (!session) {
            res.status(400);
            return next(new Error('No open session found. Open the register first.'));
        }

        if (type === 'payin') {
            session.totalCashIn += Number(amount);
        } else {
            session.totalCashOut += Number(amount);
        }

        session.transactions.push({
            type,
            amount: Number(amount),
            note: note || `Manual ${type}`,
            timestamp: Date.now()
        });

        await session.save();

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        next(error);
    }
});

// @desc    Get Session History
// @route   GET /api/registers/:id/sessions
// @access  Private
router.get('/:id/sessions', protect, async (req, res, next) => {
    try {
        const sessions = await RegisterSession.find({ registerId: req.params.id })
            .populate('cashierId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
