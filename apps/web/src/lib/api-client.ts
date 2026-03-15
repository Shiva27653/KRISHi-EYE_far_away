'use client'

// API routes have no version prefix; strip /v1 automatically if callers include it
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    // Strip /v1 prefix since backend routes have no version prefix
    const normalizedEndpoint = endpoint.startsWith('/v1/') ? endpoint.slice(3) : endpoint;

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    // S-01: Explicitly remove legacy localStorage tokens if found to prevent confusion
    if (typeof window !== 'undefined') {
        const legacyToken = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('access_token');
        if (legacyToken) {
            localStorage.removeItem('token');
            localStorage.removeItem('jwt');
            localStorage.removeItem('access_token');
            console.log('Purged legacy localStorage authentication tokens.');
        }
    }

    const response = await fetch(`${BASE_URL}${normalizedEndpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Include HTTP-Only cookies automatically
    });

    if (!response.ok) {
        // NOTE: Do NOT redirect on 401 here. The dashboard layout handles
        // auth redirects via router.push (soft navigation). Using
        // window.location.href caused infinite reload loops because
        // AuthProvider's session check always triggers on mount.
        const errorData = await response.json().catch(() => ({}));
        // Normalize: NestJS may return { message: { message: "...", error: "..." } }
        let errorMsg = 'Request failed';
        if (typeof errorData.message === 'string') {
            errorMsg = errorData.message;
        } else if (typeof errorData.message?.message === 'string') {
            errorMsg = errorData.message.message;
        } else if (typeof errorData.error === 'string') {
            errorMsg = errorData.error;
        }
        throw new Error(errorMsg);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}
