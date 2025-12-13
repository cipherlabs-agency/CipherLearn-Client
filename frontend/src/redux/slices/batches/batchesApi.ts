import { api } from '../../api/api';
import { Batch } from '@/types';

const dummyBatches: Batch[] = [
    { id: 1, name: "Physics Class 11", subject: "Physics", students: 24, time: "10:00 AM - 11:30 AM", days: "Mon, Wed, Fri", status: "Active" },
    { id: 2, name: "Math Class 10", subject: "Mathematics", students: 18, time: "04:00 PM - 05:30 PM", days: "Tue, Thu, Sat", status: "Active" },
    { id: 3, name: "Chem Class 12", subject: "Chemistry", students: 30, time: "11:00 AM - 12:30 PM", days: "Mon, Wed, Fri", status: "Active" },
    { id: 4, name: "Bio Class 11", subject: "Biology", students: 22, time: "02:00 PM - 03:30 PM", days: "Tue, Thu", status: "Active" },
    { id: 5, name: "English Class 9", subject: "English", students: 15, time: "05:00 PM - 06:00 PM", days: "Sat, Sun", status: "Inactive" },
];

export const batchesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getBatches: builder.query({
            queryFn: async () => {
                await new Promise(resolve => setTimeout(resolve, 500));
                return { data: dummyBatches };
            },
            providesTags: ['Batches'],
        }),
        createBatch: builder.mutation({
            queryFn: async (payload) => {
                await new Promise(resolve => setTimeout(resolve, 800));
                return { data: { success: true, ...payload, id: Math.random() } };
            },
            invalidatesTags: ['Batches']
        })
    }),
});

export const { useGetBatchesQuery, useCreateBatchMutation } = batchesApi;
