const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
    // Request details
    method: {
        type: String,
        required: true,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
    },
    path: {
        type: String,
        required: true
    },
    endpoint: {
        type: String,
        required: true
    },
    
    // User information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    userRole: {
        type: String,
        default: null
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        default: null
    },
    
    // Request origin
    page: {
        type: String,
        default: null
    },
    referer: {
        type: String,
        default: null
    },
    origin: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    ip: {
        type: String,
        default: null
    },
    
    // Performance metrics
    responseTime: {
        type: Number,
        default: 0
    },
    statusCode: {
        type: Number,
        default: null
    },
    
    // Database metrics
    dbQueries: {
        type: Number,
        default: 0
    },
    dbQueryTime: {
        type: Number,
        default: 0
    },
    
    // Error tracking
    error: {
        message: String,
        stack: String
    },
    
    // Request/Response size
    requestSize: {
        type: Number,
        default: 0
    },
    responseSize: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for faster queries
apiLogSchema.index({ createdAt: -1 });
apiLogSchema.index({ endpoint: 1, createdAt: -1 });
apiLogSchema.index({ userId: 1, createdAt: -1 });
apiLogSchema.index({ companyId: 1, createdAt: -1 });
apiLogSchema.index({ page: 1, createdAt: -1 });
apiLogSchema.index({ method: 1, createdAt: -1 });

module.exports = mongoose.model('ApiLog', apiLogSchema);
