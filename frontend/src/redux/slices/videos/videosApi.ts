import { api, ApiResponse } from '../../api/api';
import {
    YoutubeVideo,
    CreateVideoInput,
    UpdateVideoInput,
    VideosQueryParams,
    VideosListResponse,
    CategoriesResponse,
    PaginationInfo
} from '@/types';

export const videosApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get all videos with filtering and pagination
        getVideos: builder.query<VideosListResponse, VideosQueryParams>({
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
            transformResponse: (response: ApiResponse<YoutubeVideo[]> & { pagination?: PaginationInfo }): VideosListResponse => ({
                videos: response.data || [],
                pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
            }),
            providesTags: ['Videos'],
        }),

        // Get videos by batch
        getVideosByBatch: builder.query<YoutubeVideo[], number>({
            query: (batchId) => `/dashboard/youtube-videos/batch/${batchId}`,
            transformResponse: (response: ApiResponse<YoutubeVideo[]>) => response.data || [],
            providesTags: ['Videos'],
        }),

        // Get single video
        getVideoById: builder.query<YoutubeVideo, number>({
            query: (id) => `/dashboard/youtube-videos/${id}`,
            transformResponse: (response: ApiResponse<YoutubeVideo>) => response.data!,
            providesTags: ['Videos'],
        }),

        // Get video categories
        getVideoCategories: builder.query<string[], number | void>({
            query: (batchId) => `/dashboard/youtube-videos/categories${batchId ? `?batchId=${batchId}` : ''}`,
            transformResponse: (response: CategoriesResponse) => response.data || [],
            providesTags: ['Videos'],
        }),

        // Upload (create) video
        uploadVideo: builder.mutation<ApiResponse<YoutubeVideo>, CreateVideoInput>({
            query: (data) => ({
                url: '/dashboard/youtube-videos/upload',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Videos', 'Dashboard'],
        }),

        // Update video
        updateVideo: builder.mutation<ApiResponse<YoutubeVideo>, { id: number; data: UpdateVideoInput }>({
            query: ({ id, data }) => ({
                url: `/dashboard/youtube-videos/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Videos'],
        }),

        // Soft delete (draft) video
        draftVideo: builder.mutation<ApiResponse<boolean>, number>({
            query: (videoId) => ({
                url: `/dashboard/youtube-videos/${videoId}/draft`,
                method: 'PUT',
            }),
            invalidatesTags: ['Videos'],
        }),

        // Permanently delete video
        deleteVideo: builder.mutation<ApiResponse<boolean>, number>({
            query: (id) => ({
                url: `/dashboard/youtube-videos/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Videos', 'Dashboard'],
        }),

        // Restore video
        restoreVideo: builder.mutation<ApiResponse<YoutubeVideo>, number>({
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
