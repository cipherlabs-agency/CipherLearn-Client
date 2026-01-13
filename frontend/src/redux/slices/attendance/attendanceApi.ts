import { api } from '../../api/api';

export interface AttendanceRecord {
    id: number;
    studentId: number;
    batchId: number;
    date: string;
    status: 'PRESENT' | 'ABSENT';
    method: 'MANUAL' | 'QR';
    markedBy?: string;
    time?: string;
    student?: {
        id: number;
        fullname: string;
        email: string;
    };
}

export interface BulkAttendanceInput {
    batchId: number;
    date: string;
    attendances: {
        studentId: number;
        status: 'PRESENT' | 'ABSENT';
    }[];
}

export interface QRCodeData {
    batchId: number;
    batchName: string;
    qrData: string;
    validFor: string;
    expiresAt: string;
}

export interface AttendanceReport {
    batchId: number;
    batchName: string;
    startDate: string;
    endDate: string;
    totalStudents: number;
    overallAttendancePercentage: number;
    studentStats: {
        studentId: number;
        studentName: string;
        email: string;
        presentDays: number;
        absentDays: number;
        totalDays: number;
        percentage: number;
    }[];
}

export const attendanceApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get batch attendance for a specific date
        getBatchAttendanceByDate: builder.query<AttendanceRecord[], { batchId: number; date: string }>({
            query: ({ batchId, date }) => `/dashboard/attendance/batch/${batchId}/date?date=${date}`,
            transformResponse: (response: any) => response.data || [],
            providesTags: ['Attendance'],
        }),

        // Get batch attendance sheet (all records)
        getBatchAttendanceSheet: builder.query<AttendanceRecord[], number>({
            query: (batchId) => `/dashboard/attendance/batch-attendance-sheet/${batchId}`,
            transformResponse: (response: any) => response.data || [],
            providesTags: ['Attendance'],
        }),

        // Get student attendance matrix (calendar view)
        getStudentAttendanceMatrix: builder.query({
            query: ({ studentId, month, year }) => {
                let url = `/dashboard/attendance/student-attendance-matrix/${studentId}`;
                const params = new URLSearchParams();
                if (month) params.append('month', month);
                if (year) params.append('year', year);
                if (params.toString()) url += `?${params.toString()}`;
                return url;
            },
            transformResponse: (response: any) => response.data,
            providesTags: ['Attendance'],
        }),

        // Get student attendance history
        getStudentAttendanceHistory: builder.query<AttendanceRecord[], { studentId: number; limit?: number }>({
            query: ({ studentId, limit = 30 }) =>
                `/dashboard/attendance/student-history/${studentId}?limit=${limit}`,
            transformResponse: (response: any) => response.data || [],
            providesTags: ['Attendance'],
        }),

        // Mark single attendance
        markAttendance: builder.mutation({
            query: (data) => ({
                url: '/dashboard/attendance/mark-attendance',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Attendance'],
        }),

        // Mark bulk attendance for multiple students
        markBulkAttendance: builder.mutation<any, BulkAttendanceInput>({
            query: (data) => ({
                url: '/dashboard/attendance/mark-bulk',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Attendance', 'Dashboard'],
        }),

        // Update attendance record
        updateAttendance: builder.mutation<any, { id: number; status: 'PRESENT' | 'ABSENT' }>({
            query: ({ id, status }) => ({
                url: `/dashboard/attendance/update/${id}`,
                method: 'PUT',
                body: { status },
            }),
            invalidatesTags: ['Attendance'],
        }),

        // Generate attendance report
        getAttendanceReport: builder.query<AttendanceReport, { batchId: number; startDate: string; endDate: string }>({
            query: ({ batchId, startDate, endDate }) =>
                `/dashboard/attendance/report/${batchId}?startDate=${startDate}&endDate=${endDate}`,
            transformResponse: (response: any) => response.data,
            providesTags: ['Attendance'],
        }),

        // Generate QR code for batch
        generateQRCode: builder.query<QRCodeData, number>({
            query: (batchId) => `/dashboard/attendance/qr/generate/${batchId}`,
            transformResponse: (response: any) => response.data,
        }),

        // Mark attendance via QR code
        markQRAttendance: builder.mutation<any, { studentId: number; qrData: string }>({
            query: (data) => ({
                url: '/dashboard/attendance/qr/mark',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Attendance'],
        }),
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
    useLazyGenerateQRCodeQuery,
    useGenerateQRCodeQuery,
    useMarkQRAttendanceMutation,
} = attendanceApi;
