const mongoose = require('mongoose');

const customerActivitySchema = new mongoose.Schema({
    // Customer information
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    
    // Activity details
    activityType: {
        type: String,
        enum: ['page_visit', 'product_view', 'login', 'logout', 'purchase', 'add_to_cart'],
        required: true
    },
    
    // Page/Product details
    page: {
        type: String,
        trim: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    productName: {
        type: String,
        trim: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale'
    },
    amount: {
        type: Number
    },
    
    // Session tracking
    sessionId: {
        type: String,
        required: true
    },
    isNewSession: {
        type: Boolean,
        default: false
    },
    
    // Device and browser info
    userAgent: {
        type: String,
        trim: true
    },
    ip: {
        type: String
    },
    
    // Timestamps
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number // in seconds
    }
}, {
    timestamps: true
});

// Indexes for performance
customerActivitySchema.index({ customerId: 1, startTime: -1 });
customerActivitySchema.index({ companyId: 1, startTime: -1 });
customerActivitySchema.index({ activityType: 1, startTime: -1 });
customerActivitySchema.index({ sessionId: 1 });
customerActivitySchema.index({ productId: 1, startTime: -1 });

// Static method to get analytics for a company
customerActivitySchema.statics.getAnalytics = async function(companyId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const matchStage = { 
        companyId: new mongoose.Types.ObjectId(companyId),
        startTime: { $gte: startDate }
    };
    
    const [
        totalActivities,
        uniqueCustomers,
        uniqueSessions,
        activityByType,
        dailyTrends,
        popularProducts,
        pageAnalytics
    ] = await Promise.all([
        this.countDocuments(matchStage),
        this.distinct('customerId', matchStage),
        this.distinct('sessionId', matchStage),
        this.aggregate([
            { $match: matchStage },
            { $group: { _id: '$activityType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        this.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
                    activities: { $sum: 1 },
                    uniqueCustomers: { $addToSet: '$customerId' },
                    uniqueSessions: { $addToSet: '$sessionId' }
                }
            },
            {
                $project: {
                    date: '$_id',
                    activities: 1,
                    uniqueCustomers: { $size: '$uniqueCustomers' },
                    uniqueSessions: { $size: '$uniqueSessions' }
                }
            },
            { $sort: { date: 1 } }
        ]),
        this.aggregate([
            { 
                $match: { 
                    ...matchStage,
                    activityType: 'product_view',
                    productId: { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$productId',
                    productName: { $first: '$productName' },
                    viewCount: { $sum: 1 },
                    uniqueViewers: { $addToSet: '$customerId' }
                }
            },
            {
                $project: {
                    productId: '$_id',
                    productName: 1,
                    viewCount: 1,
                    uniqueViewers: { $size: '$uniqueViewers' }
                }
            },
            { $sort: { viewCount: -1 } },
            { $limit: 10 }
        ]),
        this.aggregate([
            { 
                $match: { 
                    ...matchStage,
                    activityType: 'page_visit',
                    page: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$page',
                    viewCount: { $sum: 1 },
                    uniqueVisitors: { $addToSet: '$customerId' },
                    avgDuration: { $avg: '$duration' }
                }
            },
            {
                $project: {
                    page: '$_id',
                    viewCount: 1,
                    uniqueVisitors: { $size: '$uniqueVisitors' },
                    avgDuration: { $round: ['$avgDuration', 2] }
                }
            },
            { $sort: { viewCount: -1 } }
        ])
    ]);
    
    return {
        summary: {
            totalActivities,
            uniqueCustomers: uniqueCustomers.length,
            uniqueSessions: uniqueSessions.length,
            avgActivitiesPerCustomer: Math.round(totalActivities / uniqueCustomers.length) || 0
        },
        activityByType,
        dailyTrends,
        popularProducts,
        pageAnalytics
    };
};

module.exports = mongoose.model('CustomerActivity', customerActivitySchema);
