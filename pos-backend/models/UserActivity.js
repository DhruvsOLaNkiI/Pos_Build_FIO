const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
    // User information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
        enum: ['page_visit', 'product_view', 'login', 'logout', 'purchase', 'add_to_cart', 'search'],
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
    },
    
    // Additional metadata
    referrer: {
        type: String,
        trim: true
    },
    searchQuery: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for performance
userActivitySchema.index({ userId: 1, startTime: -1 });
userActivitySchema.index({ companyId: 1, startTime: -1 });
userActivitySchema.index({ activityType: 1, startTime: -1 });
userActivitySchema.index({ sessionId: 1 });
userActivitySchema.index({ productId: 1, startTime: -1 });

// Helper method to calculate session duration
userActivitySchema.methods.calculateDuration = function() {
    if (this.endTime) {
        this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    }
};

// Static method to get user engagement metrics
userActivitySchema.statics.getUserEngagementMetrics = async function(companyId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const pipeline = [
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), startTime: { $gte: startDate } } },
        {
            $group: {
                _id: '$userId',
                totalSessions: { $addToSet: '$sessionId' },
                pageViews: { $sum: { $cond: [{ $eq: ['$activityType', 'page_visit'] }, 1, 0] } },
                productViews: { $sum: { $cond: [{ $eq: ['$activityType', 'product_view'] }, 1, 0] } },
                totalDuration: { $sum: '$duration' },
                firstVisit: { $min: '$startTime' },
                lastVisit: { $max: '$startTime' },
                uniquePages: { $addToSet: '$page' }
            }
        },
        {
            $project: {
                userId: '$_id',
                totalSessions: { $size: '$totalSessions' },
                pageViews: 1,
                productViews: 1,
                totalDuration: 1,
                avgSessionDuration: { $divide: ['$totalDuration', { $size: '$totalSessions' }] },
                firstVisit: 1,
                lastVisit: 1,
                uniquePages: { $size: '$uniquePages' },
                daysActive: {
                    $divide: [
                        { $subtract: ['$lastVisit', '$firstVisit'] },
                        1000 * 60 * 60 * 24 // Convert to days
                    ]
                }
            }
        },
        { $sort: { totalSessions: -1 } }
    ];
    
    return await this.aggregate(pipeline);
};

// Static method to get popular products
userActivitySchema.statics.getPopularProducts = async function(companyId, days = 30, limit = 10) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const pipeline = [
        { 
            $match: { 
                companyId: new mongoose.Types.ObjectId(companyId),
                activityType: 'product_view',
                startTime: { $gte: startDate },
                productId: { $exists: true }
            }
        },
        {
            $group: {
                _id: '$productId',
                productName: { $first: '$productName' },
                viewCount: { $sum: 1 },
                uniqueViewers: { $addToSet: '$userId' }
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
        { $limit: limit }
    ];
    
    return await this.aggregate(pipeline);
};

// Static method to get page analytics
userActivitySchema.statics.getPageAnalytics = async function(companyId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const pipeline = [
        { 
            $match: { 
                companyId: new mongoose.Types.ObjectId(companyId),
                activityType: 'page_visit',
                startTime: { $gte: startDate },
                page: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: '$page',
                viewCount: { $sum: 1 },
                uniqueVisitors: { $addToSet: '$userId' },
                avgDuration: { $avg: '$duration' },
                totalDuration: { $sum: '$duration' }
            }
        },
        {
            $project: {
                page: '$_id',
                viewCount: 1,
                uniqueVisitors: { $size: '$uniqueVisitors' },
                avgDuration: { $round: ['$avgDuration', 2] },
                totalDuration: 1
            }
        },
        { $sort: { viewCount: -1 } }
    ];
    
    return await this.aggregate(pipeline);
};

module.exports = mongoose.model('UserActivity', userActivitySchema);
