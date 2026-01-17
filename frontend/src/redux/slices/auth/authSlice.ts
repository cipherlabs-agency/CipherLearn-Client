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
}

/**
 * Credentials payload for setting auth state
 */
interface SetCredentialsPayload {
    user: AuthUser;
    token: string;
}

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

const initialState: AuthState = {
    user: getUserFromStorage(),
    token: getTokenFromStorage(),
    status: getTokenFromStorage() ? 'authenticated' : 'idle',
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<SetCredentialsPayload>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.status = 'authenticated';
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
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
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

export const { setCredentials, logoutLocal, rehydrateAuth } = authSlice.actions;
export default authSlice.reducer;
