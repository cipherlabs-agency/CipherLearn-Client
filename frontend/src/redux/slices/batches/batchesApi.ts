import { api, ApiResponse } from '../../api/api';
import {
    Batch,
    CreateBatchInput,
    BatchTimings,
    BatchTotalStudents
} from '@/types';

// Backend response types for batches
interface BatchesResponse {
    success: boolean;
    batches: Batch[];
    message?: string;
}

interface DraftBatchesResponse {
    success: boolean;
    batches: Batch[];
    message?: string;
}

// Local types for specific endpoint inputs that might not be in shared types yet
// or strictly specific to update/delete operations

export interface UpdateBatchInput {
    id: number;
    name?: string;
    timings?: BatchTimings;
    totalStudents?: BatchTotalStudents;
    status?: 'Active' | 'Inactive' | 'Draft';
}

export interface DraftBatchInput {
    ids: number[];
}

export interface DeleteBatchInput {
    ids: number[];
}

// Response for a single batch
export interface BatchResponse {
    success: boolean;
    data: Batch;
}

export const batchesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createBatch: builder.mutation<BatchResponse, CreateBatchInput>({
            query: (batchData) => ({
                url: '/dashboard/batches',
                method: 'POST',
                body: batchData,
            }),
            invalidatesTags: ['Batches', 'Dashboard'],
        }),

        getAllBatches: builder.query<Batch[], void>({
            query: () => '/dashboard/batches',
            transformResponse: (response: BatchesResponse): Batch[] => {
                return response.batches || [];
            },
            providesTags: ['Batches'],
        }),

        getBatchById: builder.query<Batch, number>({
            query: (id) => `/dashboard/batches/${id}`,
            transformResponse: (response: BatchResponse): Batch => {
                return response.data;
            },
            providesTags: ['Batches'],
        }),

        updateBatch: builder.mutation<BatchResponse, UpdateBatchInput>({
            query: ({ id, ...batchData }) => ({
                url: `/dashboard/batches/${id}`,
                method: 'PUT',
                body: batchData,
            }),
            invalidatesTags: ['Batches', 'Dashboard'],
        }),

        deleteBatch: builder.mutation<ApiResponse<void>, number>({
            query: (id) => ({
                url: '/dashboard/batches',
                method: 'DELETE',
                body: { ids: [id] },
            }),
            invalidatesTags: ['Batches', 'Dashboard', 'Students'],
        }),

        deleteBatches: builder.mutation<ApiResponse<void>, DeleteBatchInput>({
            query: (payload) => ({
                url: '/dashboard/batches',
                method: 'DELETE',
                body: payload,
            }),
            invalidatesTags: ['Batches', 'Dashboard', 'Students'],
        }),

        draftBatch: builder.mutation<ApiResponse<void>, DraftBatchInput>({
            query: (payload) => ({
                url: '/dashboard/batches/draft',
                method: 'PUT',
                body: payload,
            }),
            invalidatesTags: ['Batches'],
        }),

        getDraftBatches: builder.query<Batch[], void>({
            query: () => '/dashboard/batches/drafts',
            transformResponse: (response: DraftBatchesResponse): Batch[] => {
                return response.batches || [];
            },
            providesTags: ['Batches'],
        }),

        // Restore soft-deleted batches
        restoreBatches: builder.mutation<ApiResponse<{ restored: number }>, number[]>({
            query: (ids) => ({
                url: '/dashboard/batches/restore',
                method: 'PUT',
                body: { ids },
            }),
            invalidatesTags: ['Batches', 'Dashboard'],
        }),

        // DANGER ZONE - Hard Delete Operations
        hardDeleteBatch: builder.mutation<ApiResponse<{ batchName: string; deletedStudents: number; deletedAttendance: number }>, number>({
            query: (id) => ({
                url: `/dashboard/batches/hard-delete/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Batches', 'Dashboard', 'Students', 'Attendance'],
        }),

        purgeDeletedBatches: builder.mutation<ApiResponse<{ deleted: number }>, void>({
            query: () => ({
                url: '/dashboard/batches/purge-deleted',
                method: 'DELETE',
            }),
            invalidatesTags: ['Batches', 'Dashboard', 'Students', 'Attendance'],
        }),
    }),
});

export const {
    useCreateBatchMutation,
    useGetAllBatchesQuery,
    useGetBatchByIdQuery,
    useUpdateBatchMutation,
    useDeleteBatchMutation,
    useDeleteBatchesMutation,
    useDraftBatchMutation,
    useGetDraftBatchesQuery,
    useRestoreBatchesMutation,
    useHardDeleteBatchMutation,
    usePurgeDeletedBatchesMutation,
} = batchesApi;

// Alias for compatibility
export const useGetBatchesQuery = useGetAllBatchesQuery;
