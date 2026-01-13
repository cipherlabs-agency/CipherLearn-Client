import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    user: { id?: number; name: string; email: string; role: string } | null;
    token: string | null;
    status: 'idle' | 'authenticated' | 'unauthenticated';
}

const getUserFromStorage = () => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('user');
        if (!user || user === 'undefined') return null;
        try {
            return JSON.parse(user);
        } catch (error) {
            console.error("Error parsing user from storage", error);
            localStorage.removeItem('user');
            return null;
        }
    }
    return null;
};

const getTokenFromStorage = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
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
        setCredentials: (state, action: PayloadAction<{ user: any; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.status = 'authenticated';
            if (action.payload.user) {
                localStorage.setItem('user', JSON.stringify(action.payload.user));
            }
            if (action.payload.token) {
                localStorage.setItem('token', action.payload.token);
            }
        },
        logoutLocal: (state) => {
            state.user = null;
            state.token = null;
            state.status = 'unauthenticated';
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
    },
});

export const { setCredentials, logoutLocal } = authSlice.actions;
export default authSlice.reducer;
