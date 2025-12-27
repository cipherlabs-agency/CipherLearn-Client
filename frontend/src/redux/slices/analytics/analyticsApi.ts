import { api } from '../../api/api';

export const analyticsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTotalStudentsCount: builder.query<{ count: number }, void>({
            query: () => '/dashboard/analytics/student-count',
            providesTags: ['Dashboard'],
        }),
        getTotalBatchesCount: builder.query<{ count: number }, void>({
            query: () => '/dashboard/analytics/batch-count',
            providesTags: ['Dashboard'],
        }),
        getBatchStudentCount: builder.query<{ count: number }, { batchId: number }>({
            query: ({ batchId }) => `/dashboard/analytics/batch/${batchId}/student-count`,
            providesTags: ['Dashboard'],
        }),
        getAttendanceMatrixOfDay: builder.query<any, { batchId: number; date?: string }>({
            query: ({ batchId, date }) => ({
                url: `/dashboard/analytics/batch/${batchId}/attendance/day`,
                params: { date },
            }),
            providesTags: ['Dashboard', 'Attendance'],
        }),
        getAttendanceMatrixOfMonth: builder.query<any, { batchId: number; month?: number; year?: number }>({
            query: ({ batchId, month, year }) => ({
                url: `/dashboard/analytics/batch/${batchId}/attendance/month`,
                params: { month, year },
            }),
            providesTags: ['Dashboard', 'Attendance'],
        }),
    }),
});

export const {
    useGetTotalStudentsCountQuery,
    useGetTotalBatchesCountQuery,
    useGetBatchStudentCountQuery,
    useGetAttendanceMatrixOfDayQuery,
    useGetAttendanceMatrixOfMonthQuery,
} = analyticsApi;
