import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * User role types
 */
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

/**
 * Authenticated user information
 */
export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

/**
 * Auth state status
 */
export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

/**
 * Auth slice state
 */
interface AuthState {
    user: AuthUser | null;
    token: string | null;
    status: AuthStatus;
    tokenExpiry: number | null;
}

/**
 * Credentials payload for setting auth state
 */
interface SetCredentialsPayload {
    user: AuthUser;
    token: string;
}

/**
 * Decode JWT token to get expiration time (without external library)
 */
const decodeJwtExpiry = (token: string): number | null => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const payload = JSON.parse(jsonPayload);
        return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch {
        return null;
    }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;

    const expiry = decodeJwtExpiry(token);
    if (!expiry) return true;

    // Add 10 second buffer to account for clock skew
    return Date.now() >= expiry - 10000;
};

/**
 * Get user from localStorage with proper error handling
 */
const getUserFromStorage = (): AuthUser | null => {
    if (typeof window === 'undefined') return null;

    const user = localStorage.getItem('user');
    if (!user || user === 'undefined') return null;

    try {
        const parsed = JSON.parse(user);
        // Validate user object structure
        if (parsed && typeof parsed.id === 'number' && typeof parsed.email === 'string') {
            return parsed as AuthUser;
        }
        return null;
    } catch (error) {
        console.error("Error parsing user from storage", error);
        localStorage.removeItem('user');
        return null;
    }
};

/**
 * Get token from localStorage
 */
const getTokenFromStorage = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
};

const getInitialAuthState = (): AuthState => {
    const token = getTokenFromStorage();
    const user = getUserFromStorage();

    // Check if token is expired on initial load
    if (token && isTokenExpired(token)) {
        // Clear expired token
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        return {
            user: null,
            token: null,
            status: 'unauthenticated',
            tokenExpiry: null,
        };
    }

    return {
        user,
        token,
        status: token ? 'authenticated' : 'idle',
        tokenExpiry: token ? decodeJwtExpiry(token) : null,
    };
};

const initialState: AuthState = getInitialAuthState();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<SetCredentialsPayload>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.status = 'authenticated';
            state.tokenExpiry = decodeJwtExpiry(action.payload.token);
            if (typeof window !== 'undefined') {
                if (action.payload.user) {
                    localStorage.setItem('user', JSON.stringify(action.payload.user));
                }
                if (action.payload.token) {
                    localStorage.setItem('token', action.payload.token);
                }
            }
        },
        logoutLocal: (state) => {
            state.user = null;
            state.token = null;
            state.status = 'unauthenticated';
            state.tokenExpiry = null;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        },
        checkAndClearExpiredToken: (state) => {
            if (state.token && isTokenExpired(state.token)) {
                state.user = null;
                state.token = null;
                state.status = 'unauthenticated';
                state.tokenExpiry = null;
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            }
        },
        rehydrateAuth: (state) => {
            if (typeof window === 'undefined') return;

            const user = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (user && user !== 'undefined' && token) {
                try {
                    const parsedUser = JSON.parse(user) as AuthUser;
                    state.user = parsedUser;
                    state.token = token;
                    state.status = 'authenticated';
                } catch (error) {
                    console.error("Error rehydrating auth", error);
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    state.status = 'unauthenticated';
                }
            } else {
                state.status = 'unauthenticated';
            }
        },
    },
});

export const { setCredentials, logoutLocal, rehydrateAuth, checkAndClearExpiredToken } = authSlice.actions;
export default authSlice.reducer;
