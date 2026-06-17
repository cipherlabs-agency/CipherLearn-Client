import { api } from "../../api/api";

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ALERT";
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], { unreadOnly?: boolean; limit?: number; page?: number }>({
      query: ({ unreadOnly = false, limit = 20, page = 1 } = {}) =>
        `/dashboard/notifications?unreadOnly=${unreadOnly}&limit=${limit}&page=${page}`,
      providesTags: ["Notifications"],
      transformResponse: (response: { success: boolean; data: Notification[]; unreadCount?: number }) =>
        response.data ?? [],
      // SSE keeps this fresh — longer cache lifetime avoids unnecessary refetches
      keepUnusedDataFor: 300,
    }),

    getUnreadCount: builder.query<number, void>({
      query: () => "/dashboard/notifications/unread-count",
      providesTags: ["Notifications"],
      transformResponse: (response: { success: boolean; count: number }) => response.count ?? 0,
      // SSE sends unread_count events — longer lifetime is fine
      keepUnusedDataFor: 300,
    }),

    markAsRead: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/notifications/${id}/read`,
        method: "PATCH",
      }),
      // SSE emits updated count after mark-as-read — invalidating ensures badge is accurate even if SSE drops
      invalidatesTags: ["Notifications"],
    }),

    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: "/dashboard/notifications/mark-all-read",
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationsApi;
