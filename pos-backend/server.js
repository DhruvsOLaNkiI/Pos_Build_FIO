const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { apiMonitoring } = require('./middleware/apiMonitoring');

// Load env vars
dotenv.config({ path: '../.env' });

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
    cors({
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:5177',
            'http://localhost:5178'
        ],
        credentials: true,
    })
);

// Serve uploads static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Dev logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// API Monitoring middleware - tracks all requests after auth routes
app.use('/api', apiMonitoring);

// Mount routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/units', require('./routes/unitRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/damage-reports', require('./routes/damageReportRoutes'));
app.use('/api/held-orders', require('./routes/heldOrderRoutes'));
app.use('/api/warehouses', require('./routes/warehouseRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
const warehouseInventoryRoutes = require('./routes/warehouseInventoryRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');
const customerAppRoutes = require('./routes/customerAppRoutes');
const registerRoutes = require('./routes/registerRoutes');

app.use('/api/warehouse-inventory', warehouseInventoryRoutes);
app.use('/api/loyalty', loyaltyRoutes);

// --- Customer Portal Application Routes ---
app.use('/api/customer-app', customerAppRoutes);
app.use('/api/registers', registerRoutes);

// --- Admin Online Orders Management ---
app.use('/api/online-orders', require('./routes/onlineOrderRoutes'));

// --- User Activity Tracking Routes ---
app.use('/api/user-activity', require('./routes/userActivityRoutes'));

// --- Super Admin Routes ---
app.use('/api/super-admin', require('./routes/superAdminRoutes'));

// --- Banner Routes ---
app.use('/api/banners', require('./routes/bannerRoutes'));

// Health check
app.get('/', (req, res) => {
    res.json({ success: true, message: 'POS System API is running' });
});

// Error Handler (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
