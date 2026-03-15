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

export const createSession = async (phone: string) => {
    const data = await apiRequest<{ access_token: string }>('/v1/auth/sessions', {
        method: 'POST',
        body: JSON.stringify({ phone }),
    });
    
    if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token);
    }
    
    return data;
};
