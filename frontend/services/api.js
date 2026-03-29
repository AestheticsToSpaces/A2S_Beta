import axios from 'axios';
import { useStore } from '../store/useStore';

// Use relative URL in development so requests go through Vite's proxy (no CORS issues).
// In production, set VITE_API_URL to the actual backend URL.
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
});

// Public endpoints that don't need (and shouldn't send) auth tokens
const PUBLIC_ROUTES = ['/users/login', '/users/register', '/gallery', '/products'];

api.interceptors.request.use(
    (config) => {
        const { token } = useStore.getState();
        const isPublic = PUBLIC_ROUTES.some(route => config.url && config.url.startsWith(route));

        if (token && !isPublic) {
            config.headers.Authorization = `Bearer ${token.trim()}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Clear stale tokens when backend rejects them
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            const isPublic = PUBLIC_ROUTES.some(route => url.startsWith(route));
            if (!isPublic) {
                useStore.getState().logout();
            }
        }
        return Promise.reject(error);
    }
);

// ============================================
// AUTHENTICATION (Java Backend Auth)
// ============================================

export const login = async (email, password) => {
    try {
        const response = await api.post('/users/login', { email, password });
        const { token, ...user } = response.data;

        // Update Zustand Store
        useStore.getState().login(user, token);

        return user;
    } catch (error) {
        throw error.response?.data?.message || 'Login failed';
    }
};

export const register = async (name, email, password, location = '', subscribe = false) => {
    try {
        await api.post('/users/register', { name, email, password, location, subscribe });
        // After registration, user can login
        return { success: true };
    } catch (error) {
        throw error.response?.data?.message || 'Registration failed';
    }
};

export const subscribeToNewsletter = async (email) => {
    try {
        const response = await api.post('/newsletter/subscribe', { email });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Subscription failed';
    }
};

export const logout = async () => {
    useStore.getState().logout();
};

// ============================================
// USER PROFILE
// ============================================

export const getUserProfile = async () => {
    try {
        const response = await api.get('/users/profile');
        const profile = response.data;

        const normalizedProfile = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            location: profile.location,
            styleDNA: profile.styleDNA,
            styleSelections: profile.styleSelections || [],
            tutorialCompleted: !!profile.tutorialCompleted,
            savedDesigns: profile.savedDesigns || [],
            watchlist: profile.watchlist || [],
            consultantCredits: profile.consultantCredits,
            vastuCredits: profile.vastuCredits,
            memberSince: profile.memberSince ? new Date(profile.memberSince).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric'
            }) : 'Member',
        };

        // Sync with global store
        useStore.getState().setProfile(normalizedProfile);

        return normalizedProfile;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch profile';
    }
};

export const updateUserProfile = async (updates) => {
    try {
        const response = await api.put('/users/profile', updates);
        // Refresh profile in store
        await getUserProfile();
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Update failed';
    }
};

export const saveDesign = async (designId) => {
    try {
        const response = await api.post('/users/saved-designs', { designId });
        return response.data; // Returns the updated saved designs list
    } catch (error) {
        throw error.response?.data?.message || 'Failed to save design';
    }
};

export const toggleWatchlist = async (productId) => {
    try {
        const response = await api.post('/users/watchlist', { productId });
        return response.data; // Returns the updated watchlist list
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update watchlist';
    }
};

// ============================================
// DESIGNS
// ============================================

export const getDesigns = async () => {
    try {
        const response = await api.get('/gallery');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching designs:', error);
        throw error;
    }
};

export const getProducts = async () => {
    try {
        const response = await api.get('/products');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

export const getDesignById = async (id) => {
    try {
        const response = await api.get(`/gallery/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching design:', error);
        throw error;
    }
};

// ============================================
// CHAT
// ============================================

export const sendChatMessage = async (message, projectContext) => {
    try {
        const response = await api.post('/chat', { message, projectContext });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Chat failed';
    }
};

export const performVastuAudit = async (formData) => {
    try {
        const response = await api.post('/chat/vastu', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Vastu audit failed';
    }
};
// ============================================
// WAITLIST
// ============================================

export const getWaitlistStatus = async () => {
    try {
        const response = await api.get('/waitlist/status');
        return response.data;
    } catch (error) {
        console.error('Error fetching waitlist status:', error);
        throw error;
    }
};

export const joinPhase2Waitlist = async () => {
    try {
        const response = await api.post('/waitlist/join');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to join waitlist';
    }
};

export const subscribeToDesignTips = async (email) => {
    try {
        const response = await api.post('/subscribers/tips', { email });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Subscription failed';
    }
};
