import { api, ApiResponse } from '../../api/api';
import {
    AttendanceRecord,
    MarkAttendanceInput,
    BulkAttendanceInput,
    UpdateAttendanceInput,
    AttendanceReport,
    AttendanceReportParams,
    AttendanceMatrixData,
    // QR attendance temporarily disabled
    // QRCodeData,
    // QRCodeStatusData,
    // MarkQRAttendanceInput,
} from '@/types';

// Local query param types
export interface AttendanceByDateParams {
    batchId: number;
    date: string;
}

export interface StudentMatrixParams {
    studentId: number;
    month?: number;
    year?: number;
}

export interface StudentHistoryParams {
    studentId: number;
    limit?: number;
}

export const attendanceApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get batch attendance for a specific date
        getBatchAttendanceByDate: builder.query<AttendanceRecord[], AttendanceByDateParams>({
            query: ({ batchId, date }) => `/dashboard/attendance/batch/${batchId}/date?date=${date}`,
            transformResponse: (response: ApiResponse<AttendanceRecord[]>) => response.data || [],
            providesTags: ['Attendance'],
            // Attendance can be updated mid-session — expire after 60s
            keepUnusedDataFor: 60,
        }),

        // Get batch attendance sheet (all records)
        getBatchAttendanceSheet: builder.query<AttendanceRecord[], number>({
            query: (batchId) => `/dashboard/attendance/batch-attendance-sheet/${batchId}`,
            transformResponse: (response: ApiResponse<AttendanceRecord[]>) => response.data || [],
            providesTags: ['Attendance'],
        }),

        // Get student attendance matrix (calendar view)
        getStudentAttendanceMatrix: builder.query<AttendanceMatrixData, StudentMatrixParams>({
            query: ({ studentId, month, year }) => {
                let url = `/dashboard/attendance/student-attendance-matrix/${studentId}`;
                const params = new URLSearchParams();
                if (month !== undefined) params.append('month', month.toString());
                if (year !== undefined) params.append('year', year.toString());
                if (params.toString()) url += `?${params.toString()}`;
                return url;
            },
            transformResponse: (response: ApiResponse<AttendanceMatrixData>) => response.data!,
            providesTags: ['Attendance'],
        }),

        // Get student attendance history
        getStudentAttendanceHistory: builder.query<AttendanceRecord[], StudentHistoryParams>({
            query: ({ studentId, limit = 30 }) =>
                `/dashboard/attendance/student-history/${studentId}?limit=${limit}`,
            transformResponse: (response: ApiResponse<AttendanceRecord[]>) => response.data || [],
            providesTags: ['Attendance'],
        }),

        // Mark single attendance (Admin/Teacher)
        markAttendance: builder.mutation<ApiResponse<AttendanceRecord>, MarkAttendanceInput>({
            query: (data) => ({
                url: '/dashboard/attendance/mark-attendance',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Attendance'],
        }),

        // Mark bulk attendance for multiple students (Admin/Teacher)
        markBulkAttendance: builder.mutation<ApiResponse<AttendanceRecord[]>, BulkAttendanceInput>({
            query: (data) => ({
                url: '/dashboard/attendance/mark-bulk',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Attendance', 'Dashboard'],
        }),

        // Update attendance record (Admin/Teacher)
        updateAttendance: builder.mutation<ApiResponse<AttendanceRecord>, UpdateAttendanceInput>({
            query: ({ id, status }) => ({
                url: `/dashboard/attendance/update/${id}`,
                method: 'PUT',
                body: { status },
            }),
            invalidatesTags: ['Attendance'],
        }),

        // Generate attendance report (Admin/Teacher)
        getAttendanceReport: builder.query<AttendanceReport, AttendanceReportParams>({
            query: ({ batchId, startDate, endDate, page = 1, limit = 50 }) => {
                const params = new URLSearchParams({
                    startDate,
                    endDate,
                    page: String(page),
                    limit: String(limit),
                });
                return `/dashboard/attendance/report/${batchId}?${params.toString()}`;
            },
            transformResponse: (response: ApiResponse<AttendanceReport>) => response.data!,
            providesTags: ['Attendance'],
        }),

        // =====================
        // QR CODE ATTENDANCE - TEMPORARILY DISABLED
        // =====================
        // QR attendance feature is currently disabled.
        // Manual attendance marking by teachers/admins is the only supported method.
        //
        // // Generate QR code for batch
        // generateQRCode: builder.query<QRCodeData, number>({
        //     query: (batchId) => `/dashboard/attendance/qr/generate/${batchId}`,
        //     transformResponse: (response: ApiResponse<QRCodeData>) => response.data!,
        // }),
        //
        // // Get QR code status for batch
        // getQRCodeStatus: builder.query<QRCodeStatusData, number>({
        //     query: (batchId) => `/dashboard/attendance/qr/status/${batchId}`,
        //     transformResponse: (response: ApiResponse<QRCodeStatusData>) => response.data!,
        // }),
        //
        // // Mark attendance via QR code
        // markQRAttendance: builder.mutation<ApiResponse<AttendanceRecord>, MarkQRAttendanceInput>({
        //     query: (data) => ({
        //         url: '/dashboard/attendance/qr/mark',
        //         method: 'POST',
        //         body: data,
        //     }),
        //     invalidatesTags: ['Attendance'],
        // }),
    }),
});

export const {
    useGetBatchAttendanceByDateQuery,
    useGetBatchAttendanceSheetQuery,
    useGetStudentAttendanceMatrixQuery,
    useGetStudentAttendanceHistoryQuery,
    useMarkAttendanceMutation,
    useMarkBulkAttendanceMutation,
    useUpdateAttendanceMutation,
    useGetAttendanceReportQuery,
    // QR attendance temporarily disabled
    // useLazyGenerateQRCodeQuery,
    // useGenerateQRCodeQuery,
    // useGetQRCodeStatusQuery,
    // useMarkQRAttendanceMutation,
} = attendanceApi;
