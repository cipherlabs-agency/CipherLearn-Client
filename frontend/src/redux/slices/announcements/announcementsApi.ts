import { api, ApiResponse, PaginationInfo } from '../../api/api';

// Types
export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Announcement {
    id: number;
    title: string;
    description: string;
    imageUrl: string | null;
    date: string | null;
    priority: AnnouncementPriority;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface GetAnnouncementsParams {
    page?: number;
    limit?: number;
    priority?: AnnouncementPriority;
    isActive?: boolean;
}

export interface AnnouncementsResponse {
    success: boolean;
    data: Announcement[];
    pagination: PaginationInfo;
}

export interface AnnouncementResponse {
    success: boolean;
    data: Announcement;
    message?: string;
}

export interface CreateAnnouncementData {
    title: string;
    description: string;
    imageUrl?: string;
    date?: string;
    priority?: AnnouncementPriority;
}

export interface UpdateAnnouncementData {
    title?: string;
    description?: string;
    imageUrl?: string;
    date?: string;
    priority?: AnnouncementPriority;
    isActive?: boolean;
}

export const announcementsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAnnouncements: builder.query<AnnouncementsResponse, GetAnnouncementsParams | void>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params?.page) queryParams.append('page', params.page.toString());
                if (params?.limit) queryParams.append('limit', params.limit.toString());
                if (params?.priority) queryParams.append('priority', params.priority);
                if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

                const queryString = queryParams.toString();
                return `/dashboard/announcements${queryString ? `?${queryString}` : ''}`;
            },
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'Announcements' as const, id })),
                        { type: 'Announcements', id: 'LIST' },
                    ]
                    : [{ type: 'Announcements', id: 'LIST' }],
        }),

        getActiveAnnouncements: builder.query<ApiResponse<Announcement[]>, void>({
            query: () => '/dashboard/announcements/active',
            providesTags: [{ type: 'Announcements', id: 'ACTIVE' }],
        }),

        getAnnouncementById: builder.query<AnnouncementResponse, number>({
            query: (id) => `/dashboard/announcements/${id}`,
            providesTags: (result, error, id) => [{ type: 'Announcements', id }],
        }),

        createAnnouncement: builder.mutation<AnnouncementResponse, FormData>({
            query: (formData) => ({
                url: '/dashboard/announcements',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: [{ type: 'Announcements', id: 'LIST' }, { type: 'Announcements', id: 'ACTIVE' }],
        }),

        updateAnnouncement: builder.mutation<AnnouncementResponse, { id: number; formData: FormData }>({
            query: ({ id, formData }) => ({
                url: `/dashboard/announcements/${id}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Announcements', id },
                { type: 'Announcements', id: 'LIST' },
                { type: 'Announcements', id: 'ACTIVE' },
            ],
        }),

        deleteAnnouncement: builder.mutation<ApiResponse<null>, number>({
            query: (id) => ({
                url: `/dashboard/announcements/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Announcements', id },
                { type: 'Announcements', id: 'LIST' },
                { type: 'Announcements', id: 'ACTIVE' },
            ],
        }),
    }),
});

export const {
    useGetAnnouncementsQuery,
    useGetActiveAnnouncementsQuery,
    useGetAnnouncementByIdQuery,
    useCreateAnnouncementMutation,
    useUpdateAnnouncementMutation,
    useDeleteAnnouncementMutation,
} = announcementsApi;
