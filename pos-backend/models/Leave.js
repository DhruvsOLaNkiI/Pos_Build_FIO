const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        type: {
            type: String,
            enum: ['sick', 'casual', 'earned', 'other'],
            default: 'casual',
        },
        reason: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        adminNotes: {
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

module.exports = mongoose.model('Leave', leaveSchema);
