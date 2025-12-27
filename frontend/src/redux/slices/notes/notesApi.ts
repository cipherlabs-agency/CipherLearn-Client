import { api } from '../../api/api';
import { Note } from '@/types';

export const notesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNotes: builder.query<Note[], { batchId?: number; page?: number; limit?: number; category?: string } | void>({
            query: (params) => ({
                url: '/dashboard/notes',
                params: params || {},
            }),
            transformResponse: (response: any) => response.data || response,
            providesTags: ['Notes'],
        }),
        getNoteById: builder.query<Note, number>({
            query: (id) => `/dashboard/notes/${id}`,
            transformResponse: (response: any) => response.data || response,
            providesTags: ['Notes'],
        }),
        uploadNote: builder.mutation<{ success: boolean; data?: Note }, FormData>({
            query: (formData) => ({
                url: '/dashboard/notes',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Notes']
        }),
        updateNote: builder.mutation<{ success: boolean; data?: Note }, { id: number; formData: FormData }>({
            query: ({ id, formData }) => ({
                url: `/dashboard/notes/${id}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: ['Notes']
        }),
        deleteNote: builder.mutation<{ success: boolean }, number>({
            query: (id) => ({
                url: `/dashboard/notes/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Notes']
        })
    }),
});

export const { useGetNotesQuery, useGetNoteByIdQuery, useUploadNoteMutation, useUpdateNoteMutation, useDeleteNoteMutation } = notesApi;

