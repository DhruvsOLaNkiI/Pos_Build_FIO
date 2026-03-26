const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getCompanies,
    getCompany,
    updateCompanyStatus,
    getPlatformAnalytics,
    createCompany,
    getGlobalSettings,
    updateGlobalSettings
} = require('../controllers/superAdminController');
const {
    getApiAnalytics,
    getApiLogs,
    getEndpointDetails,
    getPagePerformance,
    getDbPerformance,
    clearOldLogs
} = require('../controllers/apiMonitoringController');
const {
    getUserActivityAnalytics,
    getUserEngagement,
    getPopularProducts,
    getPageAnalytics,
    getReturningUsers,
    getCartAbandonment,
    getActivityLogs,
    clearOldActivities
} = require('../controllers/userActivityController');

// All routes require super-admin role
router.use(protect, authorize('super-admin'));

router.get('/analytics', getPlatformAnalytics);
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompany);
router.put('/companies/:id/status', updateCompanyStatus);
router.post('/companies', createCompany);

// Global Settings
router.get('/global-settings', getGlobalSettings);
router.put('/global-settings', updateGlobalSettings);

// API Monitoring Routes
router.get('/api-monitoring/analytics', getApiAnalytics);
router.get('/api-monitoring/logs', getApiLogs);
router.get('/api-monitoring/endpoints/:endpoint', getEndpointDetails);
router.get('/api-monitoring/pages', getPagePerformance);
router.get('/api-monitoring/db-performance', getDbPerformance);
router.delete('/api-monitoring/logs', clearOldLogs);

// User Activity Monitoring Routes
router.get('/user-activity/analytics', getUserActivityAnalytics);
router.get('/user-activity/engagement', getUserEngagement);
router.get('/user-activity/popular-products', getPopularProducts);
router.get('/user-activity/page-analytics', getPageAnalytics);
router.get('/user-activity/returning-users', getReturningUsers);
router.get('/user-activity/cart-abandonment', getCartAbandonment);
router.get('/user-activity/logs', getActivityLogs);
router.delete('/user-activity/clear-old', clearOldActivities);

module.exports = router;
