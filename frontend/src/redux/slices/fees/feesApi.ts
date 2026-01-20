import { api, ApiResponse, PaginationInfo } from '../../api/api';
import {
    FeeStructure,
    FeeReceipt,
    CreateFeeStructureInput,
    UpdateFeeStructureInput,
    CreateFeeReceiptInput,
    UpdateFeeReceiptInput,
    BulkCreateReceiptsInput,
    BulkCreateResult,
    FeeReceiptFilters,
    FeeReceiptSummary,
    StudentFeesSummary,
} from '@/types';

// Response types
interface FeeStructuresResponse {
    success: boolean;
    data: FeeStructure[];
}

interface FeeStructureResponse {
    success: boolean;
    data: FeeStructure;
    message?: string;
}

interface FeeReceiptsResponse {
    success: boolean;
    data: FeeReceipt[];
    pagination?: PaginationInfo;
}

interface FeeReceiptResponse {
    success: boolean;
    data: FeeReceipt;
    message?: string;
}

interface BulkCreateResponse {
    success: boolean;
    data: BulkCreateResult;
    message?: string;
}

interface SummaryResponse {
    success: boolean;
    data: FeeReceiptSummary;
}

interface StudentSummaryResponse {
    success: boolean;
    data: StudentFeesSummary;
}

export const feesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // =====================
        // Fee Structure Endpoints
        // =====================

        createFeeStructure: builder.mutation<FeeStructure, CreateFeeStructureInput>({
            query: (data) => ({
                url: '/dashboard/fees/structures',
                method: 'POST',
                body: data,
            }),
            transformResponse: (response: FeeStructureResponse) => response.data,
            invalidatesTags: ['Fees'],
        }),

        getFeeStructuresByBatch: builder.query<FeeStructure[], number>({
            query: (batchId) => `/dashboard/fees/structures/batch/${batchId}`,
            transformResponse: (response: FeeStructuresResponse) => response.data,
            providesTags: ['Fees'],
        }),

        updateFeeStructure: builder.mutation<FeeStructure, { id: number; data: UpdateFeeStructureInput }>({
            query: ({ id, data }) => ({
                url: `/dashboard/fees/structures/${id}`,
                method: 'PUT',
                body: data,
            }),
            transformResponse: (response: FeeStructureResponse) => response.data,
            invalidatesTags: ['Fees'],
        }),

        deleteFeeStructure: builder.mutation<void, number>({
            query: (id) => ({
                url: `/dashboard/fees/structures/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Fees'],
        }),

        // =====================
        // Fee Receipt Endpoints
        // =====================

        createFeeReceipt: builder.mutation<FeeReceipt, CreateFeeReceiptInput>({
            query: (data) => ({
                url: '/dashboard/fees/receipts',
                method: 'POST',
                body: data,
            }),
            transformResponse: (response: FeeReceiptResponse) => response.data,
            invalidatesTags: ['Fees'],
        }),

        bulkCreateReceipts: builder.mutation<BulkCreateResult, BulkCreateReceiptsInput>({
            query: (data) => ({
                url: '/dashboard/fees/receipts/bulk',
                method: 'POST',
                body: data,
            }),
            transformResponse: (response: any) => {
                // Handle various response structures robustly
                if (response?.data) return response.data;
                if (response?.result) return response.result;
                if (typeof response?.created === 'number') return response;
                return response;
            },
            invalidatesTags: ['Fees'],
        }),

        getFeeReceipts: builder.query<{ receipts: FeeReceipt[]; pagination: PaginationInfo }, FeeReceiptFilters>({
            query: (filters) => {
                const params = new URLSearchParams();
                if (filters.batchId) params.append('batchId', filters.batchId.toString());
                if (filters.studentId) params.append('studentId', filters.studentId.toString());
                if (filters.status) params.append('status', filters.status);
                if (filters.academicMonth) params.append('academicMonth', filters.academicMonth.toString());
                if (filters.academicYear) params.append('academicYear', filters.academicYear.toString());
                if (filters.startDate) params.append('startDate', filters.startDate);
                if (filters.endDate) params.append('endDate', filters.endDate);
                if (filters.paymentMode) params.append('paymentMode', filters.paymentMode);
                if (filters.page) params.append('page', filters.page.toString());
                if (filters.limit) params.append('limit', filters.limit.toString());

                return `/dashboard/fees/receipts?${params.toString()}`;
            },
            transformResponse: (response: FeeReceiptsResponse & { pagination: PaginationInfo }) => ({
                receipts: response.data,
                pagination: response.pagination!,
            }),
            providesTags: ['Fees'],
        }),

        getFeeReceiptById: builder.query<FeeReceipt, number>({
            query: (id) => `/dashboard/fees/receipts/${id}`,
            transformResponse: (response: FeeReceiptResponse) => response.data,
            providesTags: ['Fees'],
        }),

        updateFeeReceipt: builder.mutation<FeeReceipt, { id: number; data: UpdateFeeReceiptInput }>({
            query: ({ id, data }) => ({
                url: `/dashboard/fees/receipts/${id}`,
                method: 'PUT',
                body: data,
            }),
            transformResponse: (response: FeeReceiptResponse) => response.data,
            invalidatesTags: ['Fees'],
        }),

        deleteFeeReceipt: builder.mutation<void, number>({
            query: (id) => ({
                url: `/dashboard/fees/receipts/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Fees'],
        }),

        // =====================
        // Summary Endpoints
        // =====================

        getReceiptsSummary: builder.query<FeeReceiptSummary, { batchId?: number; studentId?: number; academicYear?: number }>({
            query: (filters) => {
                const params = new URLSearchParams();
                if (filters.batchId) params.append('batchId', filters.batchId.toString());
                if (filters.studentId) params.append('studentId', filters.studentId.toString());
                if (filters.academicYear) params.append('academicYear', filters.academicYear.toString());

                return `/dashboard/fees/receipts/summary?${params.toString()}`;
            },
            transformResponse: (response: SummaryResponse) => response.data,
            providesTags: ['Fees'],
        }),

        getStudentFeesSummary: builder.query<StudentFeesSummary, number>({
            query: (studentId) => `/dashboard/fees/student/${studentId}/summary`,
            transformResponse: (response: StudentSummaryResponse) => response.data,
            providesTags: ['Fees'],
        }),

        // =====================
        // Student-facing Endpoints
        // =====================

        getMyReceipts: builder.query<FeeReceipt[], void>({
            query: () => '/dashboard/fees/my-receipts',
            transformResponse: (response: FeeReceiptsResponse) => response.data,
            providesTags: ['Fees'],
        }),

        getMySummary: builder.query<StudentFeesSummary, void>({
            query: () => '/dashboard/fees/my-summary',
            transformResponse: (response: StudentSummaryResponse) => response.data,
            providesTags: ['Fees'],
        }),
    }),
});

export const {
    // Fee Structure hooks
    useCreateFeeStructureMutation,
    useGetFeeStructuresByBatchQuery,
    useUpdateFeeStructureMutation,
    useDeleteFeeStructureMutation,

    // Fee Receipt hooks
    useCreateFeeReceiptMutation,
    useBulkCreateReceiptsMutation,
    useGetFeeReceiptsQuery,
    useGetFeeReceiptByIdQuery,
    useUpdateFeeReceiptMutation,
    useDeleteFeeReceiptMutation,

    // Summary hooks
    useGetReceiptsSummaryQuery,
    useGetStudentFeesSummaryQuery,

    // Student-facing hooks
    useGetMyReceiptsQuery,
    useGetMySummaryQuery,
} = feesApi;
