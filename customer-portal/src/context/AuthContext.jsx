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

    const login = async (customerId) => {
        const { data } = await API.post('/auth/login', { customerId });
        localStorage.setItem('customerToken', data.token);
        setCustomer(data.customer);
        return data.customer;
    };

    const logout = () => {
        localStorage.removeItem('customerToken');
        setCustomer(null);
    };

    const value = {
        customer,
        isAuthenticated: !!customer,
        loading,
        login,
        logout,
        refreshProfile: checkStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
