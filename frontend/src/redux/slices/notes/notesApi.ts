import { api } from '../../api/api';

export interface Note {
    id: number;
    title: string;
    content: string[];
    batchId: number;
    category?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateNoteInput {
    title: string;
    content?: string[];
    batchId: number;
    category?: string;
}

export interface UpdateNoteInput {
    title?: string;
    content?: string[];
    batchId?: number;
    category?: string;
}

export interface NotesQueryParams {
    batchId?: number;
    category?: string;
    page?: number;
    limit?: number;
}

export const notesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get all notes with filtering and pagination
        getNotes: builder.query<{ notes: Note[]; pagination: any }, NotesQueryParams>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.batchId) searchParams.append('batchId', params.batchId.toString());
                if (params.category) searchParams.append('category', params.category);
                if (params.page) searchParams.append('page', params.page.toString());
                if (params.limit) searchParams.append('limit', params.limit.toString());
                const queryString = searchParams.toString();
                return `/dashboard/notes${queryString ? `?${queryString}` : ''}`;
            },
            transformResponse: (response: any) => ({
                notes: response.data || [],
                pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
            }),
            providesTags: ['Notes'],
        }),

        // Get single note
        getNoteById: builder.query<Note, number>({
            query: (id) => `/dashboard/notes/${id}`,
            transformResponse: (response: any) => response.data,
            providesTags: ['Notes'],
        }),

        // Create note with file upload
        uploadNote: builder.mutation<Note, FormData>({
            query: (formData) => ({
                url: '/dashboard/notes',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Notes'],
        }),

        // Update note with optional file upload
        updateNote: builder.mutation<Note, { id: number; formData: FormData }>({
            query: ({ id, formData }) => ({
                url: `/dashboard/notes/${id}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: ['Notes'],
        }),

        // Delete note
        deleteNote: builder.mutation<void, number>({
            query: (id) => ({
                url: `/dashboard/notes/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Notes'],
        }),
    }),
});

export const {
    useGetNotesQuery,
    useGetNoteByIdQuery,
    useUploadNoteMutation,
    useUpdateNoteMutation,
    useDeleteNoteMutation,
} = notesApi;
