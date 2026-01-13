import { api } from '../../api/api';

export interface YoutubeVideo {
    id: number;
    title: string;
    description?: string;
    url: string;
    visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    category?: string;
    batchId: number;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateVideoInput {
    title: string;
    description?: string;
    url: string;
    visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    category?: string;
    batchId: number;
}

export interface UpdateVideoInput {
    title?: string;
    description?: string;
    url?: string;
    visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    category?: string;
    batchId?: number;
}

export interface VideosQueryParams {
    batchId?: number;
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
}

export const videosApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get all videos with filtering and pagination
        getVideos: builder.query<{ videos: YoutubeVideo[]; pagination: any }, VideosQueryParams>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params.batchId) searchParams.append('batchId', params.batchId.toString());
                if (params.category) searchParams.append('category', params.category);
                if (params.page) searchParams.append('page', params.page.toString());
                if (params.limit) searchParams.append('limit', params.limit.toString());
                if (params.search) searchParams.append('search', params.search);
                const queryString = searchParams.toString();
                return `/dashboard/youtube-videos${queryString ? `?${queryString}` : ''}`;
            },
            transformResponse: (response: any) => ({
                videos: response.data || [],
                pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
            }),
            providesTags: ['Videos'],
        }),

        // Get videos by batch
        getVideosByBatch: builder.query<YoutubeVideo[], number>({
            query: (batchId) => `/dashboard/youtube-videos/batch/${batchId}`,
            transformResponse: (response: any) => response.data || [],
            providesTags: ['Videos'],
        }),

        // Get single video
        getVideoById: builder.query<YoutubeVideo, number>({
            query: (id) => `/dashboard/youtube-videos/${id}`,
            transformResponse: (response: any) => response.data,
            providesTags: ['Videos'],
        }),

        // Get video categories
        getVideoCategories: builder.query<string[], number | undefined>({
            query: (batchId) => `/dashboard/youtube-videos/categories${batchId ? `?batchId=${batchId}` : ''}`,
            transformResponse: (response: any) => response.data || [],
            providesTags: ['Videos'],
        }),

        // Upload (create) video
        uploadVideo: builder.mutation<YoutubeVideo, CreateVideoInput>({
            query: (data) => ({
                url: '/dashboard/youtube-videos/upload',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Videos'],
        }),

        // Update video
        updateVideo: builder.mutation<YoutubeVideo, { id: number; data: UpdateVideoInput }>({
            query: ({ id, data }) => ({
                url: `/dashboard/youtube-videos/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Videos'],
        }),

        // Soft delete (draft) video
        draftVideo: builder.mutation<boolean, number>({
            query: (videoId) => ({
                url: `/dashboard/youtube-videos/${videoId}/draft`,
                method: 'PUT',
            }),
            invalidatesTags: ['Videos'],
        }),

        // Permanently delete video
        deleteVideo: builder.mutation<boolean, number>({
            query: (id) => ({
                url: `/dashboard/youtube-videos/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Videos'],
        }),

        // Restore video
        restoreVideo: builder.mutation<YoutubeVideo, number>({
            query: (id) => ({
                url: `/dashboard/youtube-videos/${id}/restore`,
                method: 'PUT',
            }),
            invalidatesTags: ['Videos'],
        }),
    }),
});

export const {
    useGetVideosQuery,
    useGetVideosByBatchQuery,
    useGetVideoByIdQuery,
    useGetVideoCategoriesQuery,
    useUploadVideoMutation,
    useUpdateVideoMutation,
    useDraftVideoMutation,
    useDeleteVideoMutation,
    useRestoreVideoMutation,
} = videosApi;
