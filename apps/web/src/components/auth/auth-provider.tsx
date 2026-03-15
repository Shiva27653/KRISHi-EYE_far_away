'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import type { User } from "@farmer-platform/types";
import { createSession } from '@/lib/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
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
        
        // S-01: Create session and store JWT in localStorage
        await createSession(phone);
        
        // Brief settling delay for mobile/socket sync if needed
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
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, requestOtp, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
