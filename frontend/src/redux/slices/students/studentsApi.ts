import { api, ApiResponse } from '../../api/api';
import {
    Student,
    StudentProfile,
    EnrollStudentInput,
    CSVPreviewData,
    CSVImportResult
} from '@/types';

export interface GetStudentsParams {
    batchId?: number;
    page?: number;
    limit?: number;
    search?: string;
}

interface StudentsListResponse {
    success: boolean;
    data: Student[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Local types for update input if not in central types
export interface UpdateStudentInput {
    firstname?: string;
    middlename?: string;
    lastname?: string;
    email?: string;
    dob?: string;
    address?: string;
    batchId?: number;
}

export const studentsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get students with server-side pagination, filtering, and search
        getStudents: builder.query<{ students: Student[]; pagination: StudentsListResponse['pagination'] }, GetStudentsParams | void>({
            query: (params) => {
                const p = params ?? {};
                const qs = new URLSearchParams();
                if (p.page) qs.set('page', String(p.page));
                if (p.limit) qs.set('limit', String(p.limit));
                if (p.search) qs.set('search', p.search);
                const queryString = qs.toString();
                const base = p.batchId
                    ? `/dashboard/student-enrollment/students/${p.batchId}`
                    : '/dashboard/student-enrollment/students';
                return queryString ? `${base}?${queryString}` : base;
            },
            transformResponse: (response: StudentsListResponse) => ({
                students: response.data,
                pagination: response.pagination,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.students.map(({ id }) => ({ type: 'Students' as const, id })),
                        { type: 'Students', id: 'LIST' }
                    ]
                    : [{ type: 'Students', id: 'LIST' }],
        }),

        // Get single student
        getStudentById: builder.query<Student, number>({
            query: (id) => `/dashboard/student-enrollment/student/${id}`,
            transformResponse: (response: ApiResponse<Student>): Student => {
                if (!response.data) {
                    throw new Error("Student data not found in response");
                }
                return response.data;
            },
            providesTags: (_result, _error, id) => [{ type: 'Students', id }],
        }),

        // Enroll single student
        enrollStudent: builder.mutation<ApiResponse<Student>, EnrollStudentInput>({
            query: (data) => ({
                url: '/dashboard/student-enrollment/enroll',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Students', id: 'LIST' }, 'Dashboard', 'Batches'],
        }),

        // Update student
        updateStudent: builder.mutation<ApiResponse<Student>, { id: number; data: UpdateStudentInput }>({
            query: ({ id, data }) => ({
                url: `/dashboard/student-enrollment/student/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Students', id },
                { type: 'Students', id: 'LIST' }
            ],
        }),

        // Delete student
        deleteStudent: builder.mutation<ApiResponse<void>, number>({
            query: (id) => ({
                url: `/dashboard/student-enrollment/student/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'Students', id },
                { type: 'Students', id: 'LIST' },
                'Dashboard',
                'Batches'
            ],
        }),

        // Preview CSV import
        previewCSV: builder.mutation<CSVPreviewData, FormData>({
            query: (formData) => ({
                url: '/dashboard/student-enrollment/csv/preview',
                method: 'POST',
                body: formData,
            }),
            transformResponse: (response: ApiResponse<CSVPreviewData>): CSVPreviewData => {
                return response.data!;
            },
        }),

        // Import students from CSV
        importCSV: builder.mutation<CSVImportResult, FormData>({
            query: (formData) => ({
                url: '/dashboard/student-enrollment/csv/import',
                method: 'POST',
                body: formData,
            }),
            transformResponse: (response: ApiResponse<CSVImportResult>): CSVImportResult => {
                return response.data!;
            },
            invalidatesTags: [{ type: 'Students', id: 'LIST' }, 'Dashboard', 'Batches'],
        }),

        // Download CSV template
        downloadCSVTemplate: builder.query<string, void>({
            query: () => ({
                url: '/dashboard/student-enrollment/csv/template',
                responseHandler: (response: Response) => response.text(),
            }),
        }),

        // Get current user's student profile (for student users)
        getMyStudentProfile: builder.query<StudentProfile, void>({
            query: () => '/dashboard/student-enrollment/my-profile',
            transformResponse: (response: ApiResponse<StudentProfile>): StudentProfile => {
                if (!response.data) {
                    throw new Error("Student profile not found");
                }
                return response.data;
            },
            providesTags: ['Students'],
        }),

        // Get soft-deleted students
        getDeletedStudents: builder.query<Student[], void>({
            query: () => '/dashboard/student-enrollment/deleted',
            transformResponse: (response: ApiResponse<Student[]>): Student[] => {
                return response.data || [];
            },
            providesTags: [{ type: 'Students', id: 'DELETED' }],
        }),

        // Restore soft-deleted students
        restoreStudents: builder.mutation<ApiResponse<{ restored: number }>, number[]>({
            query: (ids) => ({
                url: '/dashboard/student-enrollment/restore',
                method: 'PUT',
                body: { ids },
            }),
            invalidatesTags: [
                { type: 'Students', id: 'LIST' },
                { type: 'Students', id: 'DELETED' },
                'Dashboard',
                'Batches'
            ],
        }),

        // DANGER ZONE - Hard Delete Operations
        hardDeleteStudent: builder.mutation<ApiResponse<void>, number>({
            query: (id) => ({
                url: `/dashboard/student-enrollment/hard-delete/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [
                { type: 'Students', id: 'LIST' },
                { type: 'Students', id: 'DELETED' },
                'Dashboard',
                'Batches',
                'Attendance'
            ],
        }),

        hardDeleteManyStudents: builder.mutation<ApiResponse<{ deleted: number }>, number[]>({
            query: (ids) => ({
                url: '/dashboard/student-enrollment/hard-delete-many',
                method: 'DELETE',
                body: { ids },
            }),
            invalidatesTags: [
                { type: 'Students', id: 'LIST' },
                { type: 'Students', id: 'DELETED' },
                'Dashboard',
                'Batches',
                'Attendance'
            ],
        }),

        purgeDeletedStudents: builder.mutation<ApiResponse<{ deleted: number }>, void>({
            query: () => ({
                url: '/dashboard/student-enrollment/purge-deleted',
                method: 'DELETE',
            }),
            invalidatesTags: [
                { type: 'Students', id: 'LIST' },
                { type: 'Students', id: 'DELETED' },
                'Dashboard',
                'Batches',
                'Attendance'
            ],
        }),
    }),
});

export const {
    useGetStudentsQuery,
    useGetStudentByIdQuery,
    useEnrollStudentMutation,
    useUpdateStudentMutation,
    useDeleteStudentMutation,
    usePreviewCSVMutation,
    useImportCSVMutation,
    useLazyDownloadCSVTemplateQuery,
    useGetMyStudentProfileQuery,
    useGetDeletedStudentsQuery,
    useRestoreStudentsMutation,
    useHardDeleteStudentMutation,
    useHardDeleteManyStudentsMutation,
    usePurgeDeletedStudentsMutation,
} = studentsApi;
