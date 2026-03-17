import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';
import API from '@/services/api';

// Generate a unique session ID for the user
const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create a session ID from localStorage
const getSessionId = () => {
    let sessionId = localStorage.getItem('user_activity_session_id');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('user_activity_session_id', sessionId);
    }
    return sessionId;
};

// Check if this is a new session (user just logged in)
const isNewSession = () => {
    const lastSessionTime = localStorage.getItem('user_activity_last_session');
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (!lastSessionTime || (now - parseInt(lastSessionTime)) > thirtyMinutes) {
        localStorage.setItem('user_activity_last_session', now.toString());
        return true;
    }
    return false;
};

export const useUserActivityTracking = () => {
    const { user } = useAuth();
    const location = useLocation();
    const currentActivityId = useRef(null);
    const pageStartTime = useRef(Date.now());
    const sessionId = useRef(getSessionId());

    // Track page visits
    const trackPageVisit = async (pageName) => {
        if (!user || user.role === 'super-admin') return;

        try {
            const isNew = isNewSession();
            const response = await API.post('/user-activity/track', {
                activityType: 'page_visit',
                page: pageName,
                sessionId: sessionId.current,
                isNewSession: isNew,
                referrer: document.referrer
            });

            currentActivityId.current = response.data.data._id;
            pageStartTime.current = Date.now();
        } catch (error) {
            console.error('Failed to track page visit:', error);
        }
    };

    // Track product views
    const trackProductView = async (productId, productName) => {
        if (!user || user.role === 'super-admin') return;

        try {
            await API.post('/user-activity/track', {
                activityType: 'product_view',
                productId,
                productName,
                sessionId: sessionId.current,
                isNewSession: false
            });
        } catch (error) {
            console.error('Failed to track product view:', error);
        }
    };

    // Track login
    const trackLogin = async () => {
        if (!user || user.role === 'super-admin') return;

        try {
            // Generate a new session ID on login
            sessionId.current = generateSessionId();
            localStorage.setItem('user_activity_session_id', sessionId.current);
            localStorage.setItem('user_activity_last_session', Date.now().toString());

            await API.post('/user-activity/track', {
                activityType: 'login',
                sessionId: sessionId.current,
                isNewSession: true
            });
        } catch (error) {
            console.error('Failed to track login:', error);
        }
    };

    // Track logout
    const trackLogout = async () => {
        if (!user || user.role === 'super-admin') return;

        try {
            await API.post('/user-activity/track', {
                activityType: 'logout',
                sessionId: sessionId.current,
                isNewSession: false
            });

            // Clear session ID on logout
            localStorage.removeItem('user_activity_session_id');
        } catch (error) {
            console.error('Failed to track logout:', error);
        }
    };

    // Track search
    const trackSearch = async (searchQuery) => {
        if (!user || user.role === 'super-admin') return;

        try {
            await API.post('/user-activity/track', {
                activityType: 'search',
                searchQuery,
                sessionId: sessionId.current,
                isNewSession: false
            });
        } catch (error) {
            console.error('Failed to track search:', error);
        }
    };

    // Track add to cart
    const trackAddToCart = async (productId, productName) => {
        if (!user || user.role === 'super-admin') return;

        try {
            await API.post('/user-activity/track', {
                activityType: 'add_to_cart',
                productId,
                productName,
                sessionId: sessionId.current,
                isNewSession: false
            });
        } catch (error) {
            console.error('Failed to track add to cart:', error);
        }
    };

    // Track purchase
    const trackPurchase = async () => {
        if (!user || user.role === 'super-admin') return;

        try {
            await API.post('/user-activity/track', {
                activityType: 'purchase',
                sessionId: sessionId.current,
                isNewSession: false
            });
        } catch (error) {
            console.error('Failed to track purchase:', error);
        }
    };

    // Update page duration when user leaves the page
    const updatePageDuration = async () => {
        if (!currentActivityId.current || !user || user.role === 'super-admin') return;

        const duration = Math.floor((Date.now() - pageStartTime.current) / 1000);
        
        if (duration < 1) return; // Don't track visits less than 1 second

        try {
            await API.put(`/user-activity/${currentActivityId.current}/duration`, {
                duration
            });
        } catch (error) {
            console.error('Failed to update page duration:', error);
        }
    };

    // Auto-track page visits on route changes
    useEffect(() => {
        if (!user || user.role === 'super-admin') return;

        // Update duration for previous page
        updatePageDuration();

        // Track new page visit
        const pageName = location.pathname;
        trackPageVisit(pageName);

        // Cleanup on unmount
        return () => {
            updatePageDuration();
        };
    }, [location.pathname, user]);

    // Track page duration on tab visibility change
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
    }, [user]);

    return {
        trackPageVisit,
        trackProductView,
        trackLogin,
        trackLogout,
        trackSearch,
        trackAddToCart,
        trackPurchase
    };
};

export default useUserActivityTracking;
