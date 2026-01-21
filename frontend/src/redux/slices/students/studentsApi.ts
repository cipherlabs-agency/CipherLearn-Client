import { api, ApiResponse } from '../../api/api';
import {
    Student,
    StudentProfile,
    StudentsApiResponse,
    EnrollStudentInput,
    CSVPreviewData,
    CSVImportResult
} from '@/types';

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
        // Get all students (optionally by batch)
        getStudents: builder.query<Student[], number | void>({
            query: (batchId) => {
                if (batchId) {
                    return `/dashboard/student-enrollment/students/${batchId}`;
                }
                return '/dashboard/student-enrollment/students';
            },
            // The API might return { data: [...] } or { students: [...] } or just [...]
            // We use StudentsApiResponse to type the raw response before transformation
            transformResponse: (response: StudentsApiResponse | { students?: Student[] } | Student[]): Student[] => {
                if (Array.isArray(response)) {
                    return response;
                }
                if ('data' in response && Array.isArray(response.data)) {
                    return response.data;
                }
                if ('students' in response && Array.isArray(response.students)) {
                    return response.students;
                }
                return [];
            },
            providesTags: ['Students'],
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
            providesTags: ['Students'],
        }),

        // Enroll single student
        enrollStudent: builder.mutation<ApiResponse<Student>, EnrollStudentInput>({
            query: (data) => ({
                url: '/dashboard/student-enrollment/enroll',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Students', 'Dashboard', 'Batches'],
        }),

        // Update student
        updateStudent: builder.mutation<ApiResponse<Student>, { id: number; data: UpdateStudentInput }>({
            query: ({ id, data }) => ({
                url: `/dashboard/student-enrollment/student/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Students'],
        }),

        // Delete student
        deleteStudent: builder.mutation<ApiResponse<void>, number>({
            query: (id) => ({
                url: `/dashboard/student-enrollment/student/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Students', 'Dashboard', 'Batches'],
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
            invalidatesTags: ['Students', 'Dashboard', 'Batches'],
        }),

        // Download CSV template
        downloadCSVTemplate: builder.query<string, void>({
            query: () => ({
                url: '/dashboard/student-enrollment/csv/template',
                responseHandler: (response: Response) => response.text(),
            }),
        }),

        // Get current user's student profile (for student users)
        // This matches the authenticated user's email with their student record
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
            providesTags: ['Students'],
        }),

        // Restore soft-deleted students
        restoreStudents: builder.mutation<ApiResponse<{ restored: number }>, number[]>({
            query: (ids) => ({
                url: '/dashboard/student-enrollment/restore',
                method: 'PUT',
                body: { ids },
            }),
            invalidatesTags: ['Students', 'Dashboard', 'Batches'],
        }),

        // DANGER ZONE - Hard Delete Operations
        hardDeleteStudent: builder.mutation<ApiResponse<void>, number>({
            query: (id) => ({
                url: `/dashboard/student-enrollment/hard-delete/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Students', 'Dashboard', 'Batches', 'Attendance'],
        }),

        hardDeleteManyStudents: builder.mutation<ApiResponse<{ deleted: number }>, number[]>({
            query: (ids) => ({
                url: '/dashboard/student-enrollment/hard-delete-many',
                method: 'DELETE',
                body: { ids },
            }),
            invalidatesTags: ['Students', 'Dashboard', 'Batches', 'Attendance'],
        }),

        purgeDeletedStudents: builder.mutation<ApiResponse<{ deleted: number }>, void>({
            query: () => ({
                url: '/dashboard/student-enrollment/purge-deleted',
                method: 'DELETE',
            }),
            invalidatesTags: ['Students', 'Dashboard', 'Batches', 'Attendance'],
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
