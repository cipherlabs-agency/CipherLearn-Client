import { api } from '../../api/api';
import { Teacher } from '@/types';

interface TeachersListResponse {
    success: boolean;
    data: Teacher[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface GetTeachersParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface CreateTeacherInput {
    name: string;
    email: string;
}

export interface UpdateTeacherInput {
    name?: string;
    email?: string;
}

export const teachersApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTeachers: builder.query<{ teachers: Teacher[]; pagination: TeachersListResponse['pagination'] }, GetTeachersParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params) {
                    if (params.page) searchParams.set('page', String(params.page));
                    if (params.limit) searchParams.set('limit', String(params.limit));
                    if (params.search) searchParams.set('search', params.search);
                }
                const qs = searchParams.toString();
                return `/dashboard/teachers${qs ? `?${qs}` : ''}`;
            },
            transformResponse: (response: TeachersListResponse) => ({
                teachers: response.data,
                pagination: response.pagination,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.teachers.map(({ id }) => ({ type: 'Teachers' as const, id })),
                        { type: 'Teachers', id: 'LIST' }
                    ]
                    : [{ type: 'Teachers', id: 'LIST' }],
        }),

        createTeacher: builder.mutation<{ success: boolean; data: Teacher }, CreateTeacherInput>({
            query: (data) => ({
                url: '/dashboard/teachers',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Teachers', id: 'LIST' }],
        }),

        updateTeacher: builder.mutation<{ success: boolean; data: Teacher }, { id: number; data: UpdateTeacherInput }>({
            query: ({ id, data }) => ({
                url: `/dashboard/teachers/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Teachers', id },
                { type: 'Teachers', id: 'LIST' }
            ],
        }),

        deleteTeacher: builder.mutation<{ success: boolean }, number>({
            query: (id) => ({
                url: `/dashboard/teachers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'Teachers', id },
                { type: 'Teachers', id: 'LIST' }
            ],
        }),
    }),
});

export const {
    useGetTeachersQuery,
    useCreateTeacherMutation,
    useUpdateTeacherMutation,
    useDeleteTeacherMutation,
} = teachersApi;
