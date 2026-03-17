const ApiLog = require('../models/ApiLog');
const mongoose = require('mongoose');

// Store for tracking DB queries per request
const requestDbTracker = new Map();

// Monkey-patch mongoose to count queries
const originalExec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function(...args) {
    const startTime = Date.now();
    const result = await originalExec.apply(this, args);
    
    // Try to find request context from async local storage or correlation ID
    const duration = Date.now() - startTime;
    trackDbQuery(duration);
    
    return result;
};

// Track DB query - this is a simple implementation
function trackDbQuery(duration) {
    // Get the current request context if available
    const asyncContext = getCurrentRequestContext();
    if (asyncContext) {
        asyncContext.dbQueries = (asyncContext.dbQueries || 0) + 1;
        asyncContext.dbQueryTime = (asyncContext.dbQueryTime || 0) + duration;
    }
}

// Simple context storage using AsyncLocalStorage (Node 12.17+)
let asyncLocalStorage;
try {
    const { AsyncLocalStorage } = require('async_hooks');
    asyncLocalStorage = new AsyncLocalStorage();
} catch (e) {
    // Fallback for older Node versions
    asyncLocalStorage = null;
}

function getCurrentRequestContext() {
    if (asyncLocalStorage) {
        return asyncLocalStorage.getStore();
    }
    return null;
}

function setCurrentRequestContext(context) {
    if (asyncLocalStorage) {
        return asyncLocalStorage.run(context, () => context);
    }
    return context;
}

// API Monitoring Middleware
const apiMonitoring = async (req, res, next) => {
    // Skip monitoring for certain paths
    if (req.path.startsWith('/uploads/') || req.path === '/') {
        return next();
    }
    
    const startTime = Date.now();
    const requestContext = {
        dbQueries: 0,
        dbQueryTime: 0,
        startTime: startTime
    };
    
    // Execute within async context if available
    const runWithContext = asyncLocalStorage 
        ? (fn) => asyncLocalStorage.run(requestContext, fn)
        : (fn) => fn();
    
    runWithContext(async () => {
        // Store reference for DB tracking
        requestDbTracker.set(startTime.toString(), requestContext);
        
        // Extract page/referer information
        const referer = req.headers.referer || req.headers.referrer || null;
        const origin = req.headers.origin || null;
        
        // Extract page from referer (frontend route)
        let page = null;
        if (referer) {
            try {
                const url = new URL(referer);
                page = url.pathname + url.search;
            } catch (e) {
                page = referer;
            }
        }
        
        // Get user info if available
        const userId = req.user?._id || req.user?.id || null;
        const userRole = req.user?.role || null;
        const companyId = req.headers['x-store-id'] || req.user?.companyId || null;
        
        // Get endpoint (route pattern if available, otherwise path)
        const endpoint = req.route?.path || req.path;
        
        // Calculate request size
        const requestSize = JSON.stringify(req.body || {}).length + 
                           JSON.stringify(req.query || {}).length +
                           JSON.stringify(req.params || {}).length;
        
        // Response capture
        const originalSend = res.send.bind(res);
        const originalJson = res.json.bind(res);
        let responseSize = 0;
        
        res.json = function(data) {
            responseSize = JSON.stringify(data).length;
            return originalJson(data);
        };
        
        res.send = function(data) {
            if (typeof data === 'string') {
                responseSize = data.length;
            } else if (Buffer.isBuffer(data)) {
                responseSize = data.length;
            } else if (typeof data === 'object') {
                responseSize = JSON.stringify(data).length;
            }
            return originalSend(data);
        };
        
        // Log when response finishes
        res.on('finish', async () => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            // Get final DB stats
            const dbStats = requestDbTracker.get(startTime.toString()) || { dbQueries: 0, dbQueryTime: 0 };
            requestDbTracker.delete(startTime.toString());
            
            // Create log entry
            const logEntry = {
                method: req.method,
                path: req.path,
                endpoint: endpoint,
                userId: userId,
                userRole: userRole,
                companyId: companyId,
                page: page,
                referer: referer,
                origin: origin,
                userAgent: req.headers['user-agent'],
                ip: req.ip || req.connection?.remoteAddress || null,
                responseTime: responseTime,
                statusCode: res.statusCode,
                dbQueries: dbStats.dbQueries,
                dbQueryTime: dbStats.dbQueryTime,
                requestSize: requestSize,
                responseSize: responseSize
            };
            
            // Save log asynchronously (don't block response)
            try {
                // Use setImmediate to avoid blocking
                setImmediate(async () => {
                    try {
                        await ApiLog.create(logEntry);
                    } catch (err) {
                        // Silent fail - don't affect user requests
                        console.error('Failed to save API log:', err.message);
                    }
                });
            } catch (err) {
                console.error('API Monitoring error:', err.message);
            }
        });
        
        next();
    });
};

module.exports = { apiMonitoring };
