import { api, ApiResponse } from '../../api/api';
import type { AttendanceStatus } from '@/types';

// Analytics response types
interface CountResponse {
    success: boolean;
    message: string;
    data: {
        count: number;
    };
}

interface AttendanceMatrixDay {
    date: string;
    present: number;
    absent: number;
    total: number;
    percentage: number;
}

interface AttendanceMatrixMonth {
    month: number;
    year: number;
    days: AttendanceMatrixDay[];
    summary: {
        totalPresent: number;
        totalAbsent: number;
        averagePercentage: number;
    };
}

// New analytics types
export interface EnrollmentTrendData {
    month: number;
    year: number;
    count: number;
    label: string;
}

export interface AttendanceTrendData {
    date: string;
    present: number;
    absent: number;
    total: number;
    percentage: number;
}

export interface DashboardStats {
    totalStudents: number;
    totalBatches: number;
    todayAttendance: {
        present: number;
        absent: number;
        percentage: number;
    };
    monthlyGrowth: {
        students: number;
        attendance: number;
    };
}

export interface BatchDistribution {
    batchId: number;
    batchName: string;
    studentCount: number;
}

export interface ActivityItem {
    type: 'enrollment' | 'attendance';
    message: string;
    timestamp: string;
    details: Record<string, any>;
}

export const analyticsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTotalStudentsCount: builder.query<number, void>({
            query: () => '/dashboard/analytics/student-count',
            transformResponse: (response: CountResponse) => response.data?.count || 0,
            providesTags: ['Dashboard'],
        }),
        getTotalBatchesCount: builder.query<number, void>({
            query: () => '/dashboard/analytics/batch-count',
            transformResponse: (response: CountResponse) => response.data?.count || 0,
            providesTags: ['Dashboard'],
        }),
        getBatchStudentCount: builder.query<number, { batchId: number }>({
            query: ({ batchId }) => `/dashboard/analytics/batch/${batchId}/student-count`,
            transformResponse: (response: CountResponse) => response.data?.count || 0,
            providesTags: ['Dashboard'],
        }),
        getAttendanceMatrixOfDay: builder.query<AttendanceMatrixDay, { batchId: number; date?: string }>({
            query: ({ batchId, date }) => ({
                url: `/dashboard/analytics/batch/${batchId}/attendance/day`,
                params: { date },
            }),
            transformResponse: (response: ApiResponse<AttendanceMatrixDay>) => response.data!,
            providesTags: ['Dashboard', 'Attendance'],
        }),
        getAttendanceMatrixOfMonth: builder.query<AttendanceMatrixMonth, { batchId: number; month?: number; year?: number }>({
            query: ({ batchId, month, year }) => ({
                url: `/dashboard/analytics/batch/${batchId}/attendance/month`,
                params: { month, year },
            }),
            transformResponse: (response: ApiResponse<AttendanceMatrixMonth>) => response.data!,
            providesTags: ['Dashboard', 'Attendance'],
        }),

        // New dashboard analytics endpoints
        getDashboardStats: builder.query<DashboardStats, void>({
            query: () => '/dashboard/analytics/dashboard-stats',
            transformResponse: (response: ApiResponse<DashboardStats>) => response.data!,
            providesTags: ['Dashboard'],
        }),
        getEnrollmentTrends: builder.query<EnrollmentTrendData[], { months?: number }>({
            query: ({ months = 12 }) => `/dashboard/analytics/enrollment-trends?months=${months}`,
            transformResponse: (response: ApiResponse<EnrollmentTrendData[]>) => response.data || [],
            providesTags: ['Dashboard'],
        }),
        getAttendanceTrends: builder.query<AttendanceTrendData[], { days?: number; batchId?: number }>({
            query: ({ days = 30, batchId }) => {
                let url = `/dashboard/analytics/attendance-trends?days=${days}`;
                if (batchId) url += `&batchId=${batchId}`;
                return url;
            },
            transformResponse: (response: ApiResponse<AttendanceTrendData[]>) => response.data || [],
            providesTags: ['Dashboard', 'Attendance'],
        }),
        getMonthlyAttendanceTrends: builder.query<AttendanceTrendData[], { months?: number; batchId?: number }>({
            query: ({ months = 6, batchId }) => {
                let url = `/dashboard/analytics/monthly-attendance-trends?months=${months}`;
                if (batchId) url += `&batchId=${batchId}`;
                return url;
            },
            transformResponse: (response: ApiResponse<AttendanceTrendData[]>) => response.data || [],
            providesTags: ['Dashboard', 'Attendance'],
        }),
        getBatchDistribution: builder.query<BatchDistribution[], void>({
            query: () => '/dashboard/analytics/batch-distribution',
            transformResponse: (response: ApiResponse<BatchDistribution[]>) => response.data || [],
            providesTags: ['Dashboard'],
        }),
        getRecentActivities: builder.query<ActivityItem[], { limit?: number }>({
            query: ({ limit = 10 }) => `/dashboard/analytics/recent-activities?limit=${limit}`,
            transformResponse: (response: ApiResponse<ActivityItem[]>) => response.data || [],
            providesTags: ['Dashboard'],
        }),
    }),
});

export const {
    useGetTotalStudentsCountQuery,
    useGetTotalBatchesCountQuery,
    useGetBatchStudentCountQuery,
    useGetAttendanceMatrixOfDayQuery,
    useGetAttendanceMatrixOfMonthQuery,
    useGetDashboardStatsQuery,
    useGetEnrollmentTrendsQuery,
    useGetAttendanceTrendsQuery,
    useGetMonthlyAttendanceTrendsQuery,
    useGetBatchDistributionQuery,
    useGetRecentActivitiesQuery,
} = analyticsApi;
