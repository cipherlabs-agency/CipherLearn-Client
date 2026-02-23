import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    pagination?: PaginationInfo;
}

/**
 * Pagination information from API
 */
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * API Error response structure
 */
export interface ApiErrorResponse {
    success: false;
    message: string;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState)?.auth?.token;
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    const result = await baseQuery(args, api, extraOptions);
    if (result.error && result.error.status === 401) {
        // Clear auth state and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }
    return result;
};

export const api = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    refetchOnFocus: false,
    refetchOnReconnect: true,
    // Cache unused data for 5 minutes to improve performance
    keepUnusedDataFor: 300,
    tagTypes: ['Auth', 'Students', 'Batches', 'Announcements', 'Attendance', 'Fees', 'Notes', 'Videos', 'Dashboard', 'Analytics', 'Assignments', 'Submissions', 'StudyMaterials', 'Teachers', 'Lectures', 'Tests', 'TestScores', 'Instagram'],
    endpoints: () => ({}),
});
