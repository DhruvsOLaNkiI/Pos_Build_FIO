const UserActivity = require('../models/UserActivity');
const CustomerActivity = require('../models/CustomerActivity');
const User = require('../models/User');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

// @desc    Track user activity (page visit, product view, etc.)
// @route   POST /api/user-activity/track
// @access  Private (authenticated users)
const trackActivity = async (req, res, next) => {
    try {
        const { 
            activityType, 
            page, 
            productId, 
            productName, 
            sessionId, 
            isNewSession,
            referrer,
            searchQuery 
        } = req.body;
        
        const userId = req.user.id;
        const companyId = req.user.companyId;
        
        // Create activity record
        const activity = await UserActivity.create({
            userId,
            companyId,
            activityType,
            page,
            productId,
            productName,
            sessionId,
            isNewSession: isNewSession || false,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress,
            referrer,
            searchQuery
        });
        
        res.status(201).json({
            success: true,
            data: activity
        });
    } catch (error) {
        console.error('Error tracking user activity:', error);
        next(error);
    }
};

// @desc    Update activity duration when user leaves page
// @route   PUT /api/user-activity/:id/duration
// @access  Private
const updateActivityDuration = async (req, res, next) => {
    try {
        const { duration } = req.body;
        
        const activity = await UserActivity.findByIdAndUpdate(
            req.params.id,
            { 
                endTime: new Date(),
                duration 
            },
            { new: true, runValidators: true }
        );
        
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error) {
        console.error('Error updating activity duration:', error);
        next(error);
    }
};

// @desc    Get user activity analytics for a company
// @route   GET /api/user-activity/analytics
// @access  Super Admin only
const getUserActivityAnalytics = async (req, res, next) => {
    try {
        const { days = 30, companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        // Get employee activity metrics
        const totalEmployeeActivities = await UserActivity.countDocuments({
            companyId,
            startTime: { $gte: startDate }
        });
        
        const uniqueEmployees = await UserActivity.distinct('userId', {
            companyId,
            startTime: { $gte: startDate }
        });
        
        const employeeSessions = await UserActivity.distinct('sessionId', {
            companyId,
            startTime: { $gte: startDate }
        });
        
        // Get customer activity metrics
        const totalCustomerActivities = await CustomerActivity.countDocuments({
            companyId,
            startTime: { $gte: startDate }
        });
        
        const uniqueCustomers = await CustomerActivity.distinct('customerId', {
            companyId,
            startTime: { $gte: startDate }
        });
        
        const customerSessions = await CustomerActivity.distinct('sessionId', {
            companyId,
            startTime: { $gte: startDate }
        });
        
        // Combined totals
        const totalActivities = totalEmployeeActivities + totalCustomerActivities;
        const totalUniqueUsers = uniqueEmployees.length + uniqueCustomers.length;
        const totalSessions = employeeSessions.length + customerSessions.length;
        
        // Activity type breakdown (combined from both collections)
        const employeeActivityByType = await UserActivity.aggregate([
            { $match: { companyId: new mongoose.Types.ObjectId(companyId), startTime: { $gte: startDate } } },
            { $group: { _id: '$activityType', count: { $sum: 1 } } }
        ]);
        
        const customerActivityByType = await CustomerActivity.aggregate([
            { $match: { companyId: new mongoose.Types.ObjectId(companyId), startTime: { $gte: startDate } } },
            { $group: { _id: '$activityType', count: { $sum: 1 } } }
        ]);
        
        // Merge activity types
        const activityMap = {};
        [...employeeActivityByType, ...customerActivityByType].forEach(item => {
            activityMap[item._id] = (activityMap[item._id] || 0) + item.count;
        });
        const activityByType = Object.entries(activityMap)
            .map(([type, count]) => ({ _id: type, count }))
            .sort((a, b) => b.count - a.count);
        
        // Get customer analytics for products and pages
        const customerAnalytics = await CustomerActivity.getAnalytics(companyId, days);
        
        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalActivities,
                    uniqueUsers: totalUniqueUsers,
                    totalSessions: totalSessions,
                    avgActivitiesPerUser: Math.round(totalActivities / totalUniqueUsers) || 0,
                    employeeActivities: totalEmployeeActivities,
                    customerActivities: totalCustomerActivities,
                    uniqueEmployees: uniqueEmployees.length,
                    uniqueCustomers: uniqueCustomers.length
                },
                activityByType,
                dailyTrends: customerAnalytics.dailyTrends || [],
                hourlyPattern: [],
                popularProducts: customerAnalytics.popularProducts || [],
                pageAnalytics: customerAnalytics.pageAnalytics || []
            }
        });
    } catch (error) {
        console.error('Error getting user activity analytics:', error);
        next(error);
    }
};

// @desc    Get user engagement metrics
// @route   GET /api/user-activity/engagement
// @access  Super Admin only
const getUserEngagement = async (req, res, next) => {
    try {
        const { days = 30, companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }
        
        const engagementMetrics = await UserActivity.getUserEngagementMetrics(companyId, days);
        
        // Get user details for each metric
        const userIds = engagementMetrics.map(m => m.userId);
        const users = await User.find({ _id: { $in: userIds } }).select('name email');
        
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = user;
        });
        
        const enrichedMetrics = engagementMetrics.map(metric => ({
            ...metric,
            user: userMap[metric.userId.toString()] || null
        }));
        
        res.status(200).json({
            success: true,
            data: enrichedMetrics
        });
    } catch (error) {
        console.error('Error getting user engagement:', error);
        next(error);
    }
};

// @desc    Get popular products
// @route   GET /api/user-activity/popular-products
// @access  Super Admin only
const getPopularProducts = async (req, res, next) => {
    try {
        const { days = 30, companyId, limit = 10 } = req.query;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }
        
        const popularProducts = await CustomerActivity.aggregate([
            { 
                $match: { 
                    companyId: new mongoose.Types.ObjectId(companyId),
                    activityType: 'product_view',
                    startTime: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
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
            { $limit: parseInt(limit) }
        ]);
        
        res.status(200).json({
            success: true,
            data: popularProducts
        });
    } catch (error) {
        console.error('Error getting popular products:', error);
        next(error);
    }
};

// @desc    Get page analytics
// @route   GET /api/user-activity/page-analytics
// @access  Super Admin only
const getPageAnalytics = async (req, res, next) => {
    try {
        const { days = 30, companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }
        
        const pageAnalytics = await UserActivity.getPageAnalytics(companyId, days);
        
        res.status(200).json({
            success: true,
            data: pageAnalytics
        });
    } catch (error) {
        console.error('Error getting page analytics:', error);
        next(error);
    }
};

// @desc    Get returning users (users with multiple sessions)
// @route   GET /api/user-activity/returning-users
// @access  Super Admin only
const getReturningUsers = async (req, res, next) => {
    try {
        const { days = 30, companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        const returningUsers = await UserActivity.aggregate([
            { 
                $match: { 
                    companyId: new mongoose.Types.ObjectId(companyId),
                    startTime: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    sessions: { $addToSet: '$sessionId' },
                    firstVisit: { $min: '$startTime' },
                    lastVisit: { $max: '$startTime' },
                    pageViews: { $sum: { $cond: [{ $eq: ['$activityType', 'page_visit'] }, 1, 0] } },
                    productViews: { $sum: { $cond: [{ $eq: ['$activityType', 'product_view'] }, 1, 0] } },
                    totalDuration: { $sum: '$duration' }
                }
            },
            {
                $project: {
                    userId: '$_id',
                    sessionCount: { $size: '$sessions' },
                    firstVisit: 1,
                    lastVisit: 1,
                    daysSinceFirstVisit: {
                        $divide: [
                            { $subtract: [new Date(), '$firstVisit'] },
                            1000 * 60 * 60 * 24
                        ]
                    },
                    daysSinceLastVisit: {
                        $divide: [
                            { $subtract: [new Date(), '$lastVisit'] },
                            1000 * 60 * 60 * 24
                        ]
                    },
                    pageViews: 1,
                    productViews: 1,
                    totalDuration: 1
                }
            },
            { $match: { sessionCount: { $gt: 1 } } },
            { $sort: { sessionCount: -1 } }
        ]);
        
        // Get user details
        const userIds = returningUsers.map(u => u.userId);
        const users = await User.find({ _id: { $in: userIds } }).select('name email');
        
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = user;
        });
        
        const enrichedUsers = returningUsers.map(user => ({
            ...user,
            user: userMap[user.userId.toString()] || null
        }));
        
        res.status(200).json({
            success: true,
            data: enrichedUsers
        });
    } catch (error) {
        console.error('Error getting returning users:', error);
        next(error);
    }
};

// @desc    Get user activity logs
// @route   GET /api/user-activity/logs
// @access  Super Admin only
const getActivityLogs = async (req, res, next) => {
    try {
        const { 
            companyId, 
            activityType, 
            userId, 
            page: pageFilter,
            page = 1, 
            limit = 50 
        } = req.query;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }
        
        const query = { companyId };
        
        if (activityType) query.activityType = activityType;
        if (userId) query.userId = userId;
        if (pageFilter) query.page = new RegExp(pageFilter, 'i');
        
        const logs = await UserActivity.find(query)
            .populate('userId', 'name email')
            .sort({ startTime: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));
        
        const total = await UserActivity.countDocuments(query);
        
        res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error getting activity logs:', error);
        next(error);
    }
};

// @desc    Get cart abandonment - users who added to cart but didn't purchase
// @route   GET /api/user-activity/cart-abandonment
// @access  Super Admin only
const getCartAbandonment = async (req, res, next) => {
    try {
        const { days = 30, companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        
        // Find customers who added to cart but never purchased in the same session
        const cartAbandoners = await CustomerActivity.aggregate([
            { 
                $match: { 
                    companyId: new mongoose.Types.ObjectId(companyId),
                    startTime: { $gte: startDate },
                    $or: [
                        { activityType: 'add_to_cart' },
                        { activityType: 'purchase' }
                    ]
                }
            },
            {
                $group: {
                    _id: '$customerId',
                    sessions: { $addToSet: '$sessionId' },
                    cartAdds: {
                        $push: {
                            $cond: [
                                { $eq: ['$activityType', 'add_to_cart'] },
                                {
                                    productId: '$productId',
                                    productName: '$productName',
                                    sessionId: '$sessionId',
                                    time: '$startTime'
                                },
                                null
                            ]
                        }
                    },
                    purchases: {
                        $push: {
                            $cond: [
                                { $eq: ['$activityType', 'purchase'] },
                                { sessionId: '$sessionId', time: '$startTime' },
                                null
                            ]
                        }
                    },
                    lastActivity: { $max: '$startTime' }
                }
            },
            {
                $project: {
                    customerId: '$_id',
                    sessions: { $size: '$sessions' },
                    cartAdds: {
                        $filter: {
                            input: '$cartAdds',
                            as: 'item',
                            cond: { $ne: ['$$item', null] }
                        }
                    },
                    purchaseSessions: {
                        $filter: {
                            input: '$purchases',
                            as: 'item',
                            cond: { $ne: ['$$item', null] }
                        }
                    },
                    lastActivity: 1
                }
            },
            {
                $project: {
                    customerId: 1,
                    sessions: 1,
                    cartAdds: 1,
                    lastActivity: 1,
                    purchaseSessionIds: '$purchaseSessions.sessionId',
                    abandonedItems: {
                        $filter: {
                            input: '$cartAdds',
                            as: 'cartItem',
                            cond: {
                                $not: {
                                    $in: ['$$cartItem.sessionId', '$purchaseSessions.sessionId']
                                }
                            }
                        }
                    }
                }
            },
            {
                $match: {
                    $expr: { $gt: [{ $size: '$abandonedItems' }, 0] }
                }
            },
            { $sort: { lastActivity: -1 } }
        ]);
        
        // Get customer details
        const customerIds = cartAbandoners.map(c => c.customerId);
        const customers = await Customer.find({ _id: { $in: customerIds } }).select('name mobile customerId');
        
        const customerMap = {};
        customers.forEach(c => {
            customerMap[c._id.toString()] = c;
        });
        
        const enrichedAbandoners = cartAbandoners.map(item => ({
            ...item,
            customer: customerMap[item.customerId.toString()] || null,
            abandonedCount: item.abandonedItems.length,
            totalCartAdds: item.cartAdds.length
        }));
        
        res.status(200).json({
            success: true,
            data: enrichedAbandoners
        });
    } catch (error) {
        console.error('Error getting cart abandonment:', error);
        next(error);
    }
};

// @desc    Clear old activity logs
// @route   DELETE /api/user-activity/clear-old
// @access  Super Admin only
const clearOldActivities = async (req, res, next) => {
    try {
        const { days = 90, companyId } = req.body;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        
        const result = await UserActivity.deleteMany({
            companyId,
            startTime: { $lt: cutoffDate }
        });
        
        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} old activity records`
        });
    } catch (error) {
        console.error('Error clearing old activities:', error);
        next(error);
    }
};

module.exports = {
    trackActivity,
    updateActivityDuration,
    getUserActivityAnalytics,
    getUserEngagement,
    getPopularProducts,
    getPageAnalytics,
    getReturningUsers,
    getCartAbandonment,
    getActivityLogs,
    clearOldActivities
};
