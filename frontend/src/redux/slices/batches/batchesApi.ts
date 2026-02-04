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
            // Optimistic update: add new batch to cache immediately
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data: newBatch } = await queryFulfilled;
                    // Update the getAllBatches cache
                    dispatch(
                        batchesApi.util.updateQueryData('getAllBatches', undefined, (draft) => {
                            if (newBatch.data) {
                                draft.unshift(newBatch.data);
                            }
                        })
                    );
                } catch {
                    // If mutation fails, the cache will be rolled back automatically
                }
            },
            invalidatesTags: ['Dashboard'],
        }),

        getAllBatches: builder.query<Batch[], void>({
            query: () => '/dashboard/batches',
            transformResponse: (response: BatchesResponse): Batch[] => {
                return response.batches || [];
            },
            // Provide individual tags for each batch for granular invalidation
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Batches' as const, id })),
                        { type: 'Batches', id: 'LIST' },
                    ]
                    : [{ type: 'Batches', id: 'LIST' }],
        }),

        getBatchById: builder.query<Batch, number>({
            query: (id) => `/dashboard/batches/${id}`,
            transformResponse: (response: BatchResponse): Batch => {
                return response.data;
            },
            providesTags: (result, error, id) => [{ type: 'Batches', id }],
        }),

        updateBatch: builder.mutation<BatchResponse, UpdateBatchInput>({
            query: ({ id, ...batchData }) => ({
                url: `/dashboard/batches/${id}`,
                method: 'PUT',
                body: batchData,
            }),
            // Optimistic update: update batch in cache immediately
            async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    batchesApi.util.updateQueryData('getAllBatches', undefined, (draft) => {
                        const batch = draft.find((b) => b.id === id);
                        if (batch) {
                            Object.assign(batch, patch);
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: (result, error, { id }) => [
                { type: 'Batches', id },
                'Dashboard',
            ],
        }),

        deleteBatch: builder.mutation<ApiResponse<void>, number>({
            query: (id) => ({
                url: '/dashboard/batches',
                method: 'DELETE',
                body: { ids: [id] },
            }),
            // Optimistic delete: remove from cache immediately
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    batchesApi.util.updateQueryData('getAllBatches', undefined, (draft) => {
                        const index = draft.findIndex((b) => b.id === id);
                        if (index !== -1) {
                            draft.splice(index, 1);
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: (result, error, id) => [
                { type: 'Batches', id },
                { type: 'Batches', id: 'LIST' },
                'Dashboard',
                'Students',
            ],
        }),

        deleteBatches: builder.mutation<ApiResponse<void>, DeleteBatchInput>({
            query: (payload) => ({
                url: '/dashboard/batches',
                method: 'DELETE',
                body: payload,
            }),
            // Optimistic delete: remove all from cache immediately
            async onQueryStarted({ ids }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    batchesApi.util.updateQueryData('getAllBatches', undefined, (draft) => {
                        return draft.filter((b) => !ids.includes(b.id));
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: (result, error, { ids }) => [
                ...ids.map((id) => ({ type: 'Batches' as const, id })),
                { type: 'Batches', id: 'LIST' },
                'Dashboard',
                'Students',
            ],
        }),

        draftBatch: builder.mutation<ApiResponse<void>, DraftBatchInput>({
            query: (payload) => ({
                url: '/dashboard/batches/draft',
                method: 'PUT',
                body: payload,
            }),
            invalidatesTags: (result, error, { ids }) => [
                ...ids.map((id) => ({ type: 'Batches' as const, id })),
                { type: 'Batches', id: 'LIST' },
            ],
        }),

        getDraftBatches: builder.query<Batch[], void>({
            query: () => '/dashboard/batches/drafts',
            transformResponse: (response: DraftBatchesResponse): Batch[] => {
                return response.batches || [];
            },
            providesTags: [{ type: 'Batches', id: 'DRAFTS' }],
        }),

        // Restore soft-deleted batches
        restoreBatches: builder.mutation<ApiResponse<{ restored: number }>, number[]>({
            query: (ids) => ({
                url: '/dashboard/batches/restore',
                method: 'PUT',
                body: { ids },
            }),
            invalidatesTags: (result, error, ids) => [
                ...ids.map((id) => ({ type: 'Batches' as const, id })),
                { type: 'Batches', id: 'LIST' },
                'Dashboard',
            ],
        }),

        // DANGER ZONE - Hard Delete Operations
        hardDeleteBatch: builder.mutation<ApiResponse<{ batchName: string; deletedStudents: number; deletedAttendance: number }>, number>({
            query: (id) => ({
                url: `/dashboard/batches/hard-delete/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Batches', id },
                { type: 'Batches', id: 'LIST' },
                'Dashboard',
                'Students',
                'Attendance',
            ],
        }),

        purgeDeletedBatches: builder.mutation<ApiResponse<{ deleted: number }>, void>({
            query: () => ({
                url: '/dashboard/batches/purge-deleted',
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Batches', id: 'LIST' }, 'Dashboard', 'Students', 'Attendance'],
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
