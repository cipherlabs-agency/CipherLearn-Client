import { api } from '../../api/api';

export interface Notification {
    id: number;
    userId: number;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
    isRead: boolean;
    link: string | null;
    createdAt: string;
}

export const notificationsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query<Notification[], { unreadOnly?: boolean; limit?: number; page?: number }>({
            query: ({ unreadOnly = false, limit = 10, page = 1 } = {}) =>
                `/dashboard/notifications?unreadOnly=${unreadOnly}&limit=${limit}&page=${page}`,
            providesTags: ['Notifications'],
            transformResponse: (response: { data: Notification[] }) => response.data,
            // Notifications change frequently — expire cache after 30s
            keepUnusedDataFor: 30,
        }),
        getUnreadCount: builder.query<number, void>({
            query: () => '/dashboard/notifications/unread-count',
            providesTags: ['Notifications'],
            transformResponse: (response: { count: number }) => response.count,
            // Unread count should be fresh — expire after 30s
            keepUnusedDataFor: 30,
        }),
        markAsRead: builder.mutation<void, number>({
            query: (id) => ({
                url: `/dashboard/notifications/${id}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Notifications'],
        }),
        markAllAsRead: builder.mutation<void, void>({
            query: () => ({
                url: '/dashboard/notifications/mark-all-read',
                method: 'POST',
            }),
            invalidatesTags: ['Notifications'],
        }),
    }),
});

export const {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
} = notificationsApi;
