import { api } from '../../api/api';

export interface Student {
    id: number;
    firstname: string;
    middlename: string;
    lastname: string;
    fullname: string;
    email: string;
    dob: string;
    address?: string;
    batchId?: number;
    createdAt: string;
    updatedAt?: string;
}

export interface EnrollStudentInput {
    firstname: string;
    middlename?: string;
    lastname: string;
    email: string;
    dob: string;
    address: string;
    batchId: number;
}

export interface CSVPreviewData {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    preview: {
        firstname: string;
        middlename?: string;
        lastname: string;
        email: string;
        dob: string;
        address?: string;
    }[];
    errors: {
        row: number;
        email?: string;
        error: string;
    }[];
}

export interface CSVImportResult {
    total: number;
    successful: number;
    failed: number;
    errors: {
        row: number;
        email?: string;
        error: string;
    }[];
    imported: Student[];
}

export const studentsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get all students (optionally by batch)
        getStudents: builder.query<Student[], number | undefined>({
            query: (batchId) => {
                if (batchId) {
                    return `/dashboard/student-enrollment/students/${batchId}`;
                }
                return '/dashboard/student-enrollment/students';
            },
            transformResponse: (response: any) => response.data || response.students || [],
            providesTags: ['Students'],
        }),

        // Get single student
        getStudentById: builder.query<Student, number>({
            query: (id) => `/dashboard/student-enrollment/student/${id}`,
            transformResponse: (response: any) => response.data,
            providesTags: ['Students'],
        }),

        // Enroll single student
        enrollStudent: builder.mutation<Student, EnrollStudentInput>({
            query: (data) => ({
                url: '/dashboard/student-enrollment/enroll',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Students'],
        }),

        // Update student
        updateStudent: builder.mutation<Student, { id: number; data: Partial<EnrollStudentInput> }>({
            query: ({ id, data }) => ({
                url: `/dashboard/student-enrollment/student/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Students'],
        }),

        // Delete student
        deleteStudent: builder.mutation<void, number>({
            query: (id) => ({
                url: `/dashboard/student-enrollment/student/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Students'],
        }),

        // Preview CSV import
        previewCSV: builder.mutation<CSVPreviewData, FormData>({
            query: (formData) => ({
                url: '/dashboard/student-enrollment/csv/preview',
                method: 'POST',
                body: formData,
            }),
        }),

        // Import students from CSV
        importCSV: builder.mutation<CSVImportResult, FormData>({
            query: (formData) => ({
                url: '/dashboard/student-enrollment/csv/import',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Students'],
        }),

        // Download CSV template
        downloadCSVTemplate: builder.query<string, void>({
            query: () => ({
                url: '/dashboard/student-enrollment/csv/template',
                responseHandler: (response) => response.text(),
            }),
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
} = studentsApi;
