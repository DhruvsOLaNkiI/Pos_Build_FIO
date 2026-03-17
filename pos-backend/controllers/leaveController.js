const Leave = require('../models/Leave');

// @desc    Request leave
// @route   POST /api/leaves
// @access  Private
const requestLeave = async (req, res, next) => {
    try {
        const { startDate, endDate, type, reason } = req.body;

        const leave = await Leave.create({
            employee: req.user._id,
            startDate,
            endDate,
            type,
            reason,
            companyId: req.user.companyId,
        });

        res.status(201).json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

// @desc    Get leaves (History for employee, All for owner)
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res, next) => {
    try {
        let query = { companyId: req.user.companyId };
        if (req.user.role !== 'owner') {
            query.employee = req.user._id;
        }

        // Filter by status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        const leaves = await Leave.find(query)
            .populate('employee', 'name role')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: leaves.length, data: leaves });
    } catch (error) {
        next(error);
    }
};

// @desc    Update leave status (Approve/Reject)
// @route   PUT /api/leaves/:id
// @access  Private (Owner only)
const updateLeaveStatus = async (req, res, next) => {
    try {
        const { status, adminNotes } = req.body; // status: 'approved' or 'rejected'
        const leave = await Leave.findOne({ _id: req.params.id, companyId: req.user.companyId });

        if (!leave) {
            res.status(404);
            return next(new Error('Leave request not found'));
        }

        if (status) leave.status = status;
        if (adminNotes) leave.adminNotes = adminNotes;
        leave.approvedBy = req.user._id;

        await leave.save();

        res.status(200).json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    requestLeave,
    getLeaves,
    updateLeaveStatus,
};
