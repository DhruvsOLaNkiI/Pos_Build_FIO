const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        clockIn: {
            type: Date,
        },
        clockOut: {
            type: Date,
        },
        duration: {
            type: Number, // in minutes
            default: 0,
        },
        breaks: [
            {
                startTime: Date,
                endTime: Date,
                duration: Number, // in minutes
                note: String,
            }
        ],
        totalBreakDuration: {
            type: Number, // total daily break in minutes
            default: 0,
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'on_leave', 'half_day'],
            default: 'present',
        },
        notes: {
            type: String,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure one record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
