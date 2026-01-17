import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api/api';
import authReducer from './slices/auth/authSlice';
import studentsReducer from './slices/students/studentsSlice';
import attendanceReducer from './slices/attendance/attendanceSlice';

/**
 * Redux store configuration
 * Combines all reducers and middleware
 */
export const store = configureStore({
    reducer: {
        auth: authReducer,
        students: studentsReducer,
        attendance: attendanceReducer,
        [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types for serializable check (FormData)
                ignoredActions: ['api/executeMutation'],
            },
        }).concat(api.middleware),
    devTools: process.env.NODE_ENV !== 'production',
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

/**
 * RootState type inferred from the store
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch type for typed dispatch
 */
export type AppDispatch = typeof store.dispatch;
