import { apiRequest } from './api-client';

export const clearAuthSession = async () => {
    try {
        await apiRequest('/v1/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout request failed:', error);
    }
};

export const checkAuthSession = async <T>() => {
    return apiRequest<T>('/v1/auth/sessions');
};
