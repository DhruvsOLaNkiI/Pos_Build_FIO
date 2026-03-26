import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkStatus = async () => {
        const token = localStorage.getItem('customerToken');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const { data } = await API.get('/auth/profile');
            setCustomer(data.customer);
        } catch (error) {
            console.error('Customer session expired');
            localStorage.removeItem('customerToken');
            setCustomer(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const login = async (credentials) => {
        // credentials can be { email, password } or { customerId }
        const { data } = await API.post('/auth/login', credentials);
        localStorage.setItem('customerToken', data.token);
        setCustomer(data.customer);
        return data.customer;
    };

    const signup = async (userData) => {
        const { data } = await API.post('/auth/signup', userData);
        localStorage.setItem('customerToken', data.token);
        setCustomer(data.customer);
        return data.customer;
    };

    const logout = () => {
        localStorage.removeItem('customerToken');
        setCustomer(null);
    };

    const forgotPassword = async (email) => {
        const { data } = await API.post('/auth/forgot-password', { email });
        return data;
    };

    const verifyOtp = async (email, otp) => {
        const { data } = await API.post('/auth/verify-otp', { email, otp });
        return data;
    };

    const resetPassword = async (email, otp, password) => {
        const { data } = await API.post('/auth/reset-password', { email, otp, password });
        return data;
    };

    const value = {
        customer,
        isAuthenticated: !!customer,
        loading,
        login,
        signup,
        forgotPassword,
        verifyOtp,
        resetPassword,
        logout,
        refreshProfile: checkStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
