const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add an expense title'],
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, 'Please add an amount'],
        },
        category: {
            type: String,
            required: [true, 'Please add a category'],
            enum: [
                'rent',
                'salary',
                'electricity',
                'water',
                'maintenance',
                'transport',
                'packaging',
                'marketing',
                'miscellaneous',
                'other',
            ],
        },
        description: {
            type: String,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Expense', expenseSchema);
