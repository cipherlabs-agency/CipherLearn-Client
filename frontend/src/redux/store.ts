import { configureStore } from '@reduxjs/toolkit';
import { api } from './api/api';
import authReducer from './slices/auth/authSlice';
import studentsReducer from './slices/students/studentsSlice';
import attendanceReducer from './slices/attendance/attendanceSlice';
import { setupListeners } from '@reduxjs/toolkit/query';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        students: studentsReducer,
        attendance: attendanceReducer,
        [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

