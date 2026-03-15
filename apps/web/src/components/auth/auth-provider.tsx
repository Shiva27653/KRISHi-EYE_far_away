'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    phone: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (phone: string, otp: string) => Promise<void>;
    requestOtp: (phone: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            if (window.location.pathname === '/login') {
                setLoading(false);
                return;
            }

            try {
                const userData = await apiRequest<User>('/v1/auth/sessions');
                setUser(userData);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const requestOtp = async (phone: string) => {
        await apiRequest('/v1/auth/request-otp', {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    };

    const login = async (phone: string, otp: string) => {
        await apiRequest('/v1/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ phone, otp }),
        });
        
        // S-01: Brief settling delay for mobile cookie propagation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const userData = await apiRequest<User>('/v1/auth/sessions');
        setUser(userData);
        router.push('/');
    };

    const logout = async () => {
        try {
            await apiRequest('/v1/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout failed:', error);
        }
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, requestOtp, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// NOTE: useAuth is now exported from '@/hooks/useAuth'
