import { createContext, useContext, useState, useEffect } from 'react';
import API from '@/services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [activeStore, setActiveStore] = useState(localStorage.getItem('activeStore') || null);
    const [allStores, setAllStores] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load user on mount if token exists
    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const [userRes, storesRes] = await Promise.all([
                API.get('/auth/me'),
                API.get('/stores').catch(() => ({ data: { data: [] } }))
            ]);
            setUser(userRes.data.data);
            setAllStores(storesRes.data.data || []);

            // Auto-select store if none is active or current one is invalid
            const stores = storesRes.data.data || [];
            const currentActive = activeStore;
            const activeStoreExists = currentActive && stores.some(s => s._id === currentActive);

            if (!activeStoreExists) {
                let storeId = null;
                // Try defaultStore first
                if (userRes.data.data.defaultStore) {
                    storeId = typeof userRes.data.data.defaultStore === 'string'
                        ? userRes.data.data.defaultStore
                        : userRes.data.data.defaultStore._id;
                }
                // Fall back to first available store
                if (!storeId && stores.length > 0) {
                    storeId = stores[0]._id;
                }
                if (storeId) {
                    setActiveStore(storeId);
                    localStorage.setItem('activeStore', storeId);
                }
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('activeStore');
            setActiveStore(null);
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await API.post('/auth/login', { email, password });
        const { token: newToken, data } = res.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(data);

        // Fetch all stores for the switcher
        try {
            const storesRes = await API.get('/stores');
            setAllStores(storesRes.data.data || []);
        } catch (e) { /* ignore */ }

        // Auto-select default store on login
        if (data.defaultStore) {
            const storeId = typeof data.defaultStore === 'string' ? data.defaultStore : data.defaultStore._id;
            setActiveStore(storeId);
            localStorage.setItem('activeStore', storeId);
        }

        return res.data;
    };

    const register = async (userData) => {
        const res = await API.post('/auth/register', userData);

        // If pending approval, don't store token (staff registration)
        if (res.data.pendingApproval) {
            return res.data; // Return message to show to user
        }

        // Owner registration — auto-approved, store token
        const { token: newToken, data } = res.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(data);
        return res.data;
    };

    const switchStore = (storeId) => {
        if (storeId === activeStore) return; // No change needed
        setActiveStore(storeId);
        if (storeId) {
            localStorage.setItem('activeStore', storeId);
        } else {
            localStorage.removeItem('activeStore');
        }
        // Force reload so all pages re-fetch data with the new store context
        window.location.reload();
    };

    const logout = async () => {
        try {
            await API.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('activeStore');
        setActiveStore(null);
        setToken(null);
        setUser(null);
    };

    const forgotPassword = async (email) => {
        const res = await API.post('/auth/forgot-password', { email });
        return res.data;
    };

    const resetPassword = async (resetToken, password) => {
        const res = await API.put(`/auth/reset-password/${resetToken}`, { password });
        return res.data;
    };

    const value = {
        user,
        token,
        loading,
        activeStore,
        allStores,
        switchStore,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!user,
        isOwner: user?.role === 'owner',
        isCashier: user?.role === 'cashier',
        isStaff: user?.role === 'staff',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
