import { api, ApiResponse, PaginationInfo } from '../../api/api';

export interface Lead {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    message?: string | null;
    status: string;
    batchId: number;
    batch?: { name: string } | null;
    createdAt: string;
    updatedAt: string;
}

export interface LeadListResponse {
    data: Lead[];
    pagination: PaginationInfo;
}

export interface GetLeadsParams {
    batchId?: number;
    status?: string;
    page?: number;
    limit?: number;
}

export const crmApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getLeads: builder.query<LeadListResponse, GetLeadsParams>({
            query: (params) => {
                const qs = new URLSearchParams();
                if (params.batchId) qs.set('batchId', String(params.batchId));
                if (params.status)  qs.set('status',  params.status);
                if (params.page)    qs.set('page',    String(params.page));
                if (params.limit)   qs.set('limit',   String(params.limit));
                const queryString = qs.toString();
                return `/dashboard/crm/leads${queryString ? `?${queryString}` : ''}`;
            },
            transformResponse: (response: ApiResponse<Lead[]> & { pagination?: PaginationInfo }) => ({
                data: response.data ?? [],
                pagination: response.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 1 },
            }),
            providesTags: ['Leads'],
        }),
    }),
});

export const { useGetLeadsQuery } = crmApi;
