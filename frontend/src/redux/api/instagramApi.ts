import { api, ApiResponse } from './api'

// ─── Types ────────────────────────────────────

export interface InstagramAccount {
    id: number
    userId: number
    igUserId: string
    username: string
    profilePictureUrl: string | null
    accessToken: string // always masked as "***"
    tokenExpiresAt: string | null
    followersCount: number | null
    mediaCount: number | null
    createdAt: string
    updatedAt: string
    automationRules: {
        id: number
        mediaId: string
        triggerKeyword: string
        status: 'ACTIVE' | 'PAUSED'
    }[]
}

export interface IgMedia {
    id: string
    caption?: string
    media_type: string
    media_url?: string
    thumbnail_url?: string
    permalink: string
    timestamp: string
    like_count?: number
    comments_count?: number
}

export interface IgMediaResponse {
    data: IgMedia[]
    paging?: {
        cursors?: { after?: string }
        next?: string
    }
}

export interface AutomationRule {
    id: number
    instagramAccountId: number
    mediaId: string
    mediaUrl: string | null
    mediaCaption: string | null
    mediaType: string | null
    triggerKeyword: string
    dmMessage: string
    dmType: 'TEXT' | 'TEMPLATE'
    dmButtons: Array<{ title: string; url: string }> | null
    status: 'ACTIVE' | 'PAUSED'
    dmsSentCount: number
    isFollowGated: boolean
    unfollowedMessage: string | null
    lastTriggeredAt: string | null
    createdAt: string
    updatedAt: string
    _count: { logs: number }
}

export interface AutomationLog {
    id: number
    ruleId: number
    commenterId: string
    commenterUsername: string | null
    commentText: string
    dmStatus: 'SENT' | 'FAILED' | 'RATE_LIMITED'
    errorMessage: string | null
    createdAt: string
    rule?: {
        triggerKeyword: string
        mediaId: string
        mediaUrl: string | null
    }
}

export interface AnalyticsData {
    totalDmsSent: number
    activeRules: number
    totalRules: number
    postsMonitored: number
    successRate: number
    dmsByStatus: Record<string, number>
    recentActivity: AutomationLog[]
}

// ─── API Endpoints ────────────────────────────

export const instagramApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // OAuth
        getConnectUrl: builder.query<{ url: string }, void>({
            query: () => '/dashboard/instagram/connect',
            transformResponse: (res: ApiResponse<{ url: string }>) => res.data!,
        }),

        // Account
        getInstagramAccount: builder.query<InstagramAccount | null, void>({
            query: () => '/dashboard/instagram/account',
            transformResponse: (res: ApiResponse<InstagramAccount | null>) =>
                res.data ?? null,
            providesTags: ['Instagram'],
        }),

        disconnectInstagram: builder.mutation<void, void>({
            query: () => ({
                url: '/dashboard/instagram/disconnect',
                method: 'POST',
            }),
            invalidatesTags: ['Instagram'],
        }),

        // Media
        getInstagramMedia: builder.query<IgMediaResponse, { after?: string }>({
            query: ({ after }) => ({
                url: '/dashboard/instagram/media',
                params: after ? { after } : undefined,
            }),
            transformResponse: (res: ApiResponse<IgMediaResponse>) => res.data!,
        }),

        // Rules
        getAutomationRules: builder.query<AutomationRule[], { mediaId?: string }>({
            query: ({ mediaId }) => ({
                url: '/dashboard/instagram/rules',
                params: mediaId ? { mediaId } : undefined,
            }),
            transformResponse: (res: ApiResponse<AutomationRule[]>) =>
                res.data ?? [],
            providesTags: ['Instagram'],
        }),

        createAutomationRule: builder.mutation<
            AutomationRule,
            {
                mediaId: string
                mediaUrl?: string
                mediaCaption?: string
                mediaType?: string
                triggerKeyword: string
                dmMessage: string
                dmType?: 'TEXT' | 'TEMPLATE'
                dmButtons?: Array<{ title: string; url: string }>
                isFollowGated?: boolean
                unfollowedMessage?: string
            }
        >({
            query: (body) => ({
                url: '/dashboard/instagram/rules',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Instagram'],
        }),

        updateAutomationRule: builder.mutation<
            AutomationRule,
            {
                id: number
                triggerKeyword?: string
                dmMessage?: string
                dmType?: 'TEXT' | 'TEMPLATE'
                dmButtons?: Array<{ title: string; url: string }>
                status?: 'ACTIVE' | 'PAUSED'
            }
        >({
            query: ({ id, ...body }) => ({
                url: `/dashboard/instagram/rules/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Instagram'],
        }),

        deleteAutomationRule: builder.mutation<void, number>({
            query: (id) => ({
                url: `/dashboard/instagram/rules/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Instagram'],
        }),

        // Logs
        getRuleLogs: builder.query<
            { logs: AutomationLog[]; pagination: { page: number; total: number; totalPages: number } },
            { ruleId: number; page?: number }
        >({
            query: ({ ruleId, page = 1 }) => ({
                url: `/dashboard/instagram/rules/${ruleId}/logs`,
                params: { page },
            }),
            transformResponse: (
                res: ApiResponse<AutomationLog[]> & {
                    pagination?: { page: number; total: number; totalPages: number }
                }
            ) => ({
                logs: res.data ?? [],
                pagination: res.pagination ?? { page: 1, total: 0, totalPages: 0 },
            }),
        }),

        // Analytics & Global Logs
        getAnalytics: builder.query<AnalyticsData, void>({
            query: () => '/dashboard/instagram/analytics',
            transformResponse: (res: ApiResponse<AnalyticsData>) => res.data!,
            providesTags: ['Instagram'],
        }),

        getAllLogs: builder.query<
            { logs: AutomationLog[]; pagination: { page: number; total: number; totalPages: number } },
            { page?: number; limit?: number; status?: string }
        >({
            query: ({ page = 1, limit = 30, status }) => ({
                url: '/dashboard/instagram/logs',
                params: { page, limit, ...(status ? { status } : {}) },
            }),
            transformResponse: (
                res: ApiResponse<AutomationLog[]> & {
                    pagination?: { page: number; total: number; totalPages: number }
                }
            ) => ({
                logs: res.data ?? [],
                pagination: res.pagination ?? { page: 1, total: 0, totalPages: 0 },
            }),
            providesTags: ['Instagram'],
        }),
    }),
})

export const {
    useGetConnectUrlQuery,
    useGetInstagramAccountQuery,
    useDisconnectInstagramMutation,
    useGetInstagramMediaQuery,
    useGetAutomationRulesQuery,
    useCreateAutomationRuleMutation,
    useUpdateAutomationRuleMutation,
    useDeleteAutomationRuleMutation,
    useGetRuleLogsQuery,
    useGetAnalyticsQuery,
    useGetAllLogsQuery,
} = instagramApi
