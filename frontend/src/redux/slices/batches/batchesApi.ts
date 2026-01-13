import { api } from '../../api/api';

export const batchesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createBatch: builder.mutation({
            query: (batchData) => ({
                url: '/dashboard/batches',
                method: 'POST',
                body: batchData,
            }),
            invalidatesTags: ['Batches'],
        }),
        getAllBatches: builder.query({
            query: () => '/dashboard/batches',
            providesTags: ['Batches'],
        }),
        updateBatch: builder.mutation({
            query: ({ id, ...batchData }) => ({
                url: `/dashboard/batches/${id}`,
                method: 'PUT',
                body: batchData,
            }),
            invalidatesTags: ['Batches'],
        }),
        deleteBatch: builder.mutation({
            query: (id) => ({
                url: '/dashboard/batches',
                method: 'DELETE',
                body: { ids: [id] },
            }),
            invalidatesTags: ['Batches'],
        }),
        createDraftBatch: builder.mutation({
            query: (payload) => ({
                url: '/dashboard/batches/draft',
                method: 'PUT',
                body: payload,
            }),
            invalidatesTags: ['Batches'],
        }),
    }),
});

export const {
    useCreateBatchMutation,
    useGetAllBatchesQuery,
    useUpdateBatchMutation,
    useDeleteBatchMutation,
} = batchesApi;
