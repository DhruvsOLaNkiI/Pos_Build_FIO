import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import CreateProduct from '@/pages/CreateProduct';
import Units from '@/pages/Units';
import Billing from '@/pages/Billing';
import Customers from '@/pages/Customers';
import Suppliers from '@/pages/Suppliers';
import Purchases from '@/pages/Purchases';
import Employees from '@/pages/Employees';
import Reports from '@/pages/Reports';
import Expenses from '@/pages/Expenses';
import Alerts from '@/pages/Alerts';
import Settings from '@/pages/Settings';
import Warehouses from '@/pages/Warehouses';
import Inventory from '@/pages/Inventory';
import ExpiredProducts from '@/pages/ExpiredProducts';
import OrderTracking from '@/pages/OrderTracking';
import Stores from '@/pages/Stores';
import Loyalty from '@/pages/Loyalty';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import SuperAdminCompanies from '@/pages/SuperAdminCompanies';
import SuperAdminApiMonitoring from '@/pages/SuperAdminApiMonitoring';
import UserActivityAnalytics from '@/pages/UserActivityAnalytics';
import OnlineOrders from '@/pages/OnlineOrders';

function App() {
    const { isAuthenticated, loading, user } = useAuth();
    const isSuperAdmin = user?.role === 'super-admin';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to={isSuperAdmin ? '/super-admin/dashboard' : '/dashboard'} /> : <Login />}
            />
            <Route
                path="/register"
                element={isAuthenticated ? <Navigate to={isSuperAdmin ? '/super-admin/dashboard' : '/dashboard'} /> : <Register />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/new" element={<CreateProduct />} />
                <Route path="/units" element={<Units />} />

                {/* Phase 5: People Management */}
                <Route path="/customers" element={<Customers />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/employees" element={<Employees />} />

                {/* Phase 6: Purchase Management */}
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/order-tracking" element={<OrderTracking />} />

                {/* Phase 7: Reports & Expenses */}
                <Route path="/reports" element={<Reports />} />
                <Route path="/expenses" element={<Expenses />} />

                {/* Phase 8: Alerts & Settings */}
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/stores" element={<Stores />} />

                {/* Inventory Module */}
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/expired-products" element={<ExpiredProducts />} />

                {/* Loyalty & Offers */}
                <Route path="/loyalty" element={<Loyalty />} />

                {/* Online Orders */}
                <Route path="/online-orders" element={<OnlineOrders />} />

                {/* Super Admin Routes (only accessible when role === super-admin) */}
                <Route
                    path="/super-admin/dashboard"
                    element={isSuperAdmin ? <SuperAdminDashboard /> : <Navigate to="/dashboard" />}
                />
                <Route
                    path="/super-admin/companies"
                    element={isSuperAdmin ? <SuperAdminCompanies /> : <Navigate to="/dashboard" />}
                />
                <Route
                    path="/super-admin/api-monitoring"
                    element={isSuperAdmin ? <SuperAdminApiMonitoring /> : <Navigate to="/dashboard" />}
                />
                <Route
                    path="/super-admin/user-activity"
                    element={isSuperAdmin ? <UserActivityAnalytics /> : <Navigate to="/dashboard" />}
                />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to={isAuthenticated ? (isSuperAdmin ? '/super-admin/dashboard' : '/dashboard') : '/login'} />} />
        </Routes>
    );
}

// Temporary placeholder for future phases
function PlaceholderPage({ title, phase }) {
    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2">
                🚧 This module will be built in <strong>Phase {phase}</strong>
            </p>
            <div className="mt-8 p-8 border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground">
                Coming Soon
            </div>
        </div>
    );
}

export default App;
