const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Clock In (Start work day)
// @route   POST /api/attendance/clock-in
// @access  Private
const clockIn = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already clocked in today
        const existingRecord = await Attendance.findOne({
            employee: req.user._id,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        });

        if (existingRecord) {
            res.status(400);
            return next(new Error('Already clocked in today'));
        }

        const attendance = await Attendance.create({
            employee: req.user._id,
            date: new Date(),
            clockIn: new Date(),
            status: 'present',
            companyId: req.user.companyId,
        });

        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        next(error);
    }
};

// @desc    Clock Out (End work day)
// @route   POST /api/attendance/clock-out
// @access  Private
const clockOut = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            employee: req.user._id,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        });

        if (!attendance) {
            res.status(404);
            return next(new Error('No clock-in record found for today'));
        }

        if (attendance.clockOut) {
            res.status(400);
            return next(new Error('Already clocked out today'));
        }

        const now = new Date();
        attendance.clockOut = now;

        // Calculate duration in minutes
        const durationMs = now - new Date(attendance.clockIn);
        attendance.duration = Math.floor(durationMs / (1000 * 60)); // minutes

        await attendance.save();

        res.status(200).json({ success: true, data: attendance });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance status for today (for all employees - Owner view)
// @route   GET /api/attendance/today
// @access  Private (Owner/Manager)
const getTodayStatus = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendanceRecords = await Attendance.find({
            companyId: req.user.companyId,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        }).populate('employee', 'name email role');

        const allEmployees = await User.find({ companyId: req.user.companyId, role: { $ne: 'owner' }, isActive: true }).select('name email role');

        // Merge lists to show who is absent
        const statusList = allEmployees.map((emp) => {
            const record = attendanceRecords.find((r) => r.employee._id.toString() === emp._id.toString());
            let isOnBreak = false;
            let currentBreakStartTime = null;

            if (record && record.breaks && record.breaks.length > 0) {
                const lastBreak = record.breaks[record.breaks.length - 1];
                if (!lastBreak.endTime) {
                    isOnBreak = true;
                    currentBreakStartTime = lastBreak.startTime;
                }
            }

            return {
                _id: emp._id,
                name: emp.name,
                role: emp.role,
                status: record ? (record.clockOut ? 'clocked_out' : (isOnBreak ? 'on_break' : 'clocked_in')) : 'absent',
                clockIn: record?.clockIn,
                clockOut: record?.clockOut,
                duration: record?.duration,
                totalBreakDuration: record?.totalBreakDuration || 0,
                currentBreakStartTime: currentBreakStartTime,
            };
        });

        res.status(200).json({ success: true, data: statusList });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance history (for logged in user or specific employee)
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res, next) => {
    try {
        let query = { companyId: req.user.companyId };

        // If owner/admin, can filter by employeeId. Else view own.
        if (req.user.role === 'owner' && req.query.employeeId) {
            query.employee = req.query.employeeId;
        } else if (req.user.role !== 'owner') {
            query.employee = req.user._id;
        }

        // Date range filter
        if (req.query.startDate && req.query.endDate) {
            const endDate = new Date(req.query.endDate);
            endDate.setHours(23, 59, 59, 999);

            query.date = {
                $gte: new Date(req.query.startDate),
                $lte: endDate,
            };
        }

        const attendance = await Attendance.find(query)
            .populate('employee', 'name')
            .sort({ date: -1 });

        res.status(200).json({ success: true, count: attendance.length, data: attendance });
    } catch (error) {
        next(error);
    }
};

// @desc    Start short or lunch break
// @route   POST /api/attendance/break-start
// @access  Private
const startBreak = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            employee: req.user._id,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        });

        if (!attendance) {
            res.status(404);
            return next(new Error('No clock-in record found for today'));
        }
        if (attendance.clockOut) {
            res.status(400);
            return next(new Error('Already clocked out today'));
        }

        const lastBreak = attendance.breaks[attendance.breaks.length - 1];
        if (lastBreak && !lastBreak.endTime) {
            res.status(400);
            return next(new Error('Already on a break'));
        }

        attendance.breaks.push({
            startTime: new Date(),
            note: req.body.note || 'Break',
        });

        await attendance.save();
        res.status(200).json({ success: true, data: attendance, message: 'Break started' });
    } catch (error) {
        next(error);
    }
};

// @desc    End break
// @route   POST /api/attendance/break-end
// @access  Private
const endBreak = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            employee: req.user._id,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        });

        if (!attendance) {
            res.status(404);
            return next(new Error('No clock-in record found for today'));
        }

        const lastBreak = attendance.breaks[attendance.breaks.length - 1];
        if (!lastBreak || lastBreak.endTime) {
            res.status(400);
            return next(new Error('Not currently on a break'));
        }

        lastBreak.endTime = new Date();
        const durationMs = lastBreak.endTime - lastBreak.startTime;
        lastBreak.duration = Math.floor(durationMs / (1000 * 60)); // minutes

        attendance.totalBreakDuration = (attendance.totalBreakDuration || 0) + lastBreak.duration;

        await attendance.save();
        res.status(200).json({ success: true, data: attendance, message: 'Break ended' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    getTodayStatus,
    getAttendance,
};
