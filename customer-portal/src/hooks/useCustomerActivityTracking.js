import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import API from '../services/api';

// Generate a unique session ID
const generateSessionId = () => {
    return `cust_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create session ID
const getSessionId = () => {
    let sessionId = localStorage.getItem('customer_activity_session_id');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('customer_activity_session_id', sessionId);
    }
    return sessionId;
};

export const useCustomerActivityTracking = () => {
    const { customer } = useAuth();
    const location = useLocation();
    const currentActivityId = useRef(null);
    const pageStartTime = useRef(Date.now());
    const sessionId = useRef(getSessionId());

    // Track page visits
    const trackPageVisit = async (pageName) => {
        if (!customer) return;

        try {
            const response = await API.post('/activity/track', {
                activityType: 'page_visit',
                page: pageName,
                sessionId: sessionId.current,
                isNewSession: false
            });

            currentActivityId.current = response.data?.data?._id;
            pageStartTime.current = Date.now();
        } catch (error) {
            console.error('Failed to track page visit:', error);
        }
    };

    // Track product views
    const trackProductView = async (productId, productName) => {
        if (!customer) return;

        try {
            await API.post('/activity/track', {
                activityType: 'product_view',
                productId,
                productName,
                sessionId: sessionId.current
            });
        } catch (error) {
            console.error('Failed to track product view:', error);
        }
    };

    // Track add to cart
    const trackAddToCart = async (productId, productName) => {
        if (!customer) return;

        try {
            await API.post('/activity/track', {
                activityType: 'add_to_cart',
                productId,
                productName,
                sessionId: sessionId.current
            });
        } catch (error) {
            console.error('Failed to track add to cart:', error);
        }
    };

    // Track purchase
    const trackPurchase = async (orderId, amount) => {
        if (!customer) return;

        try {
            await API.post('/activity/track', {
                activityType: 'purchase',
                orderId,
                amount,
                sessionId: sessionId.current
            });
        } catch (error) {
            console.error('Failed to track purchase:', error);
        }
    };

    // Update page duration
    const updatePageDuration = async () => {
        if (!currentActivityId.current || !customer) return;

        const duration = Math.floor((Date.now() - pageStartTime.current) / 1000);
        
        if (duration < 1) return;

        try {
            await API.put(`/activity/${currentActivityId.current}/duration`, {
                duration
            });
        } catch (error) {
            console.error('Failed to update page duration:', error);
        }
    };

    // Auto-track on route change
    useEffect(() => {
        if (!customer) return;

        updatePageDuration();
        trackPageVisit(location.pathname);

        return () => {
            updatePageDuration();
        };
    }, [location.pathname, customer]);

    // Track on tab visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                updatePageDuration();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [customer]);

    return {
        trackPageVisit,
        trackProductView,
        trackAddToCart,
        trackPurchase
    };
};

export default useCustomerActivityTracking;
