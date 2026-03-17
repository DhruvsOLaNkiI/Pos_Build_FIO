const ApiLog = require('../models/ApiLog');
const Company = require('../models/Company');
const User = require('../models/User');

// @desc    Get API usage analytics
// @route   GET /api/super-admin/api-monitoring/analytics
// @access  Super Admin only
const getApiAnalytics = async (req, res, next) => {
    try {
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        // Total requests count
        const totalRequests = await ApiLog.countDocuments({
            createdAt: { $gte: daysAgo }
        });

        // Average response time
        const avgResponseTime = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: { _id: null, avg: { $avg: '$responseTime' } } }
        ]);

        // Total DB queries
        const totalDbQueries = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: { _id: null, total: { $sum: '$dbQueries' } } }
        ]);

        // Status code distribution
        const statusDistribution = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: { _id: '$statusCode', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Top endpoints
        const topEndpoints = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: { 
                _id: { endpoint: '$endpoint', method: '$method' },
                count: { $sum: 1 },
                avgResponseTime: { $avg: '$responseTime' },
                avgDbQueries: { $avg: '$dbQueries' }
            }},
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Top pages (frontend routes generating requests)
        const topPages = await ApiLog.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: daysAgo },
                    page: { $ne: null }
                }
            },
            { 
                $group: { 
                    _id: '$page',
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: '$responseTime' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Requests by method
        const methodDistribution = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: { _id: '$method', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Top companies by API usage
        const topCompanies = await ApiLog.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: daysAgo },
                    companyId: { $ne: null }
                }
            },
            { 
                $group: { 
                    _id: '$companyId',
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: '$responseTime' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Enrich company data
        const enrichedCompanies = await Promise.all(
            topCompanies.map(async (company) => {
                const companyData = await Company.findById(company._id).select('name email');
                return {
                    ...company,
                    name: companyData?.name || 'Unknown',
                    email: companyData?.email || ''
                };
            })
        );

        // Top users by API usage
        const topUsers = await ApiLog.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: daysAgo },
                    userId: { $ne: null }
                }
            },
            { 
                $group: { 
                    _id: '$userId',
                    count: { $sum: 1 },
                    role: { $first: '$userRole' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Enrich user data
        const enrichedUsers = await Promise.all(
            topUsers.map(async (user) => {
                const userData = await User.findById(user._id).select('name email');
                return {
                    ...user,
                    name: userData?.name || 'Unknown',
                    email: userData?.email || ''
                };
            })
        );

        // Daily breakdown
        const dailyStats = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: '$responseTime' },
                    totalDbQueries: { $sum: '$dbQueries' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Error rate
        const errorCount = await ApiLog.countDocuments({
            createdAt: { $gte: daysAgo },
            statusCode: { $gte: 400 }
        });

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalRequests,
                    avgResponseTime: Math.round(avgResponseTime[0]?.avg || 0),
                    totalDbQueries: totalDbQueries[0]?.total || 0,
                    errorRate: totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : 0,
                    errorCount
                },
                statusDistribution,
                methodDistribution,
                topEndpoints: topEndpoints.map(e => ({
                    endpoint: e._id.endpoint,
                    method: e._id.method,
                    count: e.count,
                    avgResponseTime: Math.round(e.avgResponseTime),
                    avgDbQueries: Math.round(e.avgDbQueries)
                })),
                topPages: topPages.map(p => ({
                    page: p._id,
                    count: p.count,
                    avgResponseTime: Math.round(p.avgResponseTime)
                })),
                topCompanies: enrichedCompanies,
                topUsers: enrichedUsers,
                dailyStats: dailyStats.map(d => ({
                    date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
                    count: d.count,
                    avgResponseTime: Math.round(d.avgResponseTime),
                    totalDbQueries: d.totalDbQueries
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get recent API logs
// @route   GET /api/super-admin/api-monitoring/logs
// @access  Super Admin only
const getApiLogs = async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            endpoint, 
            method, 
            statusCode,
            companyId,
            userId,
            startDate,
            endDate,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        const query = {};
        
        if (endpoint) query.endpoint = { $regex: endpoint, $options: 'i' };
        if (method) query.method = method.toUpperCase();
        if (statusCode) query.statusCode = parseInt(statusCode);
        if (companyId) query.companyId = companyId;
        if (userId) query.userId = userId;
        
        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'asc' ? 1 : -1;

        const [logs, total] = await Promise.all([
            ApiLog.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name email')
                .populate('companyId', 'name email'),
            ApiLog.countDocuments(query)
        ]);

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
        next(error);
    }
};

// @desc    Get endpoint performance details
// @route   GET /api/super-admin/api-monitoring/endpoints/:endpoint
// @access  Super Admin only
const getEndpointDetails = async (req, res, next) => {
    try {
        const { endpoint } = req.params;
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        const decodedEndpoint = decodeURIComponent(endpoint);

        const stats = await ApiLog.aggregate([
            { 
                $match: { 
                    endpoint: decodedEndpoint,
                    createdAt: { $gte: daysAgo }
                }
            },
            {
                $group: {
                    _id: '$method',
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: '$responseTime' },
                    maxResponseTime: { $max: '$responseTime' },
                    minResponseTime: { $min: '$responseTime' },
                    avgDbQueries: { $avg: '$dbQueries' },
                    errorCount: {
                        $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] }
                    }
                }
            }
        ]);

        // Hourly distribution
        const hourlyDistribution = await ApiLog.aggregate([
            { 
                $match: { 
                    endpoint: decodedEndpoint,
                    createdAt: { $gte: daysAgo }
                }
            },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                endpoint: decodedEndpoint,
                methods: stats,
                hourlyDistribution
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get page performance details
// @route   GET /api/super-admin/api-monitoring/pages
// @access  Super Admin only
const getPagePerformance = async (req, res, next) => {
    try {
        const { days = 7, page } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        const query = {
            createdAt: { $gte: daysAgo },
            page: { $ne: null }
        };
        
        if (page) {
            query.page = { $regex: page, $options: 'i' };
        }

        const pageStats = await ApiLog.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$page',
                    requestCount: { $sum: 1 },
                    uniqueEndpoints: { $addToSet: '$endpoint' },
                    avgResponseTime: { $avg: '$responseTime' },
                    totalDbQueries: { $sum: '$dbQueries' },
                    errorCount: {
                        $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    page: '$_id',
                    requestCount: 1,
                    uniqueEndpoints: { $size: '$uniqueEndpoints' },
                    avgResponseTime: { $round: ['$avgResponseTime', 2] },
                    totalDbQueries: 1,
                    errorCount: 1
                }
            },
            { $sort: { requestCount: -1 } },
            { $limit: 20 }
        ]);

        res.status(200).json({
            success: true,
            data: pageStats
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get database performance metrics
// @route   GET /api/super-admin/api-monitoring/db-performance
// @access  Super Admin only
const getDbPerformance = async (req, res, next) => {
    try {
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        // Endpoints with most DB queries
        const heavyDbEndpoints = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: daysAgo }, dbQueries: { $gt: 0 } } },
            {
                $group: {
                    _id: { endpoint: '$endpoint', method: '$method' },
                    avgQueries: { $avg: '$dbQueries' },
                    maxQueries: { $max: '$dbQueries' },
                    totalQueries: { $sum: '$dbQueries' },
                    avgQueryTime: { $avg: '$dbQueryTime' },
                    requestCount: { $sum: 1 }
                }
            },
            { $sort: { avgQueries: -1 } },
            { $limit: 15 }
        ]);

        // Daily DB query trends
        const dailyDbStats = await ApiLog.aggregate([
            { $match: { createdAt: { $gte: daysAgo }, dbQueries: { $gt: 0 } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    totalQueries: { $sum: '$dbQueries' },
                    avgQueriesPerRequest: { $avg: '$dbQueries' },
                    totalQueryTime: { $sum: '$dbQueryTime' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Pages with most DB activity
        const heavyDbPages = await ApiLog.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: daysAgo }, 
                    dbQueries: { $gt: 0 },
                    page: { $ne: null }
                }
            },
            {
                $group: {
                    _id: '$page',
                    totalQueries: { $sum: '$dbQueries' },
                    avgQueriesPerRequest: { $avg: '$dbQueries' },
                    requestCount: { $sum: 1 }
                }
            },
            { $sort: { totalQueries: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                heavyDbEndpoints: heavyDbEndpoints.map(e => ({
                    endpoint: e._id.endpoint,
                    method: e._id.method,
                    avgQueries: Math.round(e.avgQueries * 100) / 100,
                    maxQueries: e.maxQueries,
                    totalQueries: e.totalQueries,
                    avgQueryTime: Math.round(e.avgQueryTime * 100) / 100,
                    requestCount: e.requestCount
                })),
                dailyDbStats: dailyDbStats.map(d => ({
                    date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
                    totalQueries: d.totalQueries,
                    avgQueriesPerRequest: Math.round(d.avgQueriesPerRequest * 100) / 100,
                    totalQueryTime: d.totalQueryTime
                })),
                heavyDbPages
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear old API logs
// @route   DELETE /api/super-admin/api-monitoring/logs
// @access  Super Admin only
const clearOldLogs = async (req, res, next) => {
    try {
        const { days = 30 } = req.body;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const result = await ApiLog.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} old API logs`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getApiAnalytics,
    getApiLogs,
    getEndpointDetails,
    getPagePerformance,
    getDbPerformance,
    clearOldLogs
};
