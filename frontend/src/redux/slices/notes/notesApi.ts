import { api, ApiResponse } from '../../api/api';
import {
    Note,
    NoteFile,
    CreateNoteInput,
    UpdateNoteInput,
    NotesQueryParams,
    NotesListResponse,
    PaginationInfo
} from '@/types';

export const notesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get all notes with filtering and pagination
        getNotes: builder.query<NotesListResponse, NotesQueryParams>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.batchId) searchParams.append('batchId', params.batchId.toString());
                if (params.category) searchParams.append('category', params.category);
                if (params.page) searchParams.append('page', params.page.toString());
                if (params.limit) searchParams.append('limit', params.limit.toString());
                const queryString = searchParams.toString();
                return `/dashboard/notes${queryString ? `?${queryString}` : ''}`;
            },
            transformResponse: (response: ApiResponse<Note[]> & { pagination?: PaginationInfo }): NotesListResponse => ({
                notes: response.data || [],
                pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
            }),
            providesTags: ['Notes'],
        }),

        // Get single note
        getNoteById: builder.query<Note, number>({
            query: (id) => `/dashboard/notes/${id}`,
            transformResponse: (response: ApiResponse<Note>) => response.data!,
            providesTags: ['Notes'],
        }),

        // Create note with file upload (uses FormData)
        uploadNote: builder.mutation<ApiResponse<Note>, FormData>({
            query: (formData) => ({
                url: '/dashboard/notes',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Notes'],
        }),

        // Update note with optional file upload (uses FormData)
        updateNote: builder.mutation<ApiResponse<Note>, { id: number; formData: FormData }>({
            query: ({ id, formData }) => ({
                url: `/dashboard/notes/${id}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: ['Notes'],
        }),

        // Delete note
        deleteNote: builder.mutation<ApiResponse<void>, number>({
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
