import { api, ApiResponse } from '../../api/api';
import {
    Lecture,
    CreateLectureInput,
    CreateBulkLecturesInput,
    UpdateLectureInput,
} from '@/types';

interface LecturesListResponse {
    success: boolean;
    data: Lecture[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface GetLecturesParams {
    batchId?: number;
    teacherId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export const lecturesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getLectures: builder.query<{ lectures: Lecture[]; pagination: LecturesListResponse['pagination'] }, GetLecturesParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params) {
                    if (params.batchId) searchParams.set('batchId', String(params.batchId));
                    if (params.teacherId) searchParams.set('teacherId', String(params.teacherId));
                    if (params.status) searchParams.set('status', params.status);
                    if (params.startDate) searchParams.set('startDate', params.startDate);
                    if (params.endDate) searchParams.set('endDate', params.endDate);
                    if (params.page) searchParams.set('page', String(params.page));
                    if (params.limit) searchParams.set('limit', String(params.limit));
                }
                const qs = searchParams.toString();
                return `/dashboard/lectures${qs ? `?${qs}` : ''}`;
            },
            transformResponse: (response: LecturesListResponse) => ({
                lectures: response.data,
                pagination: response.pagination,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.lectures.map(({ id }) => ({ type: 'Lectures' as const, id })),
                        { type: 'Lectures', id: 'LIST' },
                    ]
                    : [{ type: 'Lectures', id: 'LIST' }],
        }),

        getLectureById: builder.query<Lecture, number>({
            query: (id) => `/dashboard/lectures/${id}`,
            transformResponse: (response: ApiResponse<Lecture>) => response.data!,
            providesTags: (_result, _error, id) => [{ type: 'Lectures', id }],
        }),

        createLecture: builder.mutation<ApiResponse<Lecture>, CreateLectureInput>({
            query: (data) => ({
                url: '/dashboard/lectures',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Lectures', id: 'LIST' }, 'Dashboard'],
        }),

        createBulkLectures: builder.mutation<ApiResponse<{ created: number; recurrenceId: string }>, CreateBulkLecturesInput>({
            query: (data) => ({
                url: '/dashboard/lectures/bulk',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Lectures', id: 'LIST' }, 'Dashboard'],
        }),

        updateLecture: builder.mutation<ApiResponse<Lecture>, { id: number; data: UpdateLectureInput }>({
            query: ({ id, data }) => ({
                url: `/dashboard/lectures/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Lectures', id },
                { type: 'Lectures', id: 'LIST' },
            ],
        }),

        assignTeacher: builder.mutation<ApiResponse<Lecture>, { id: number; teacherId: number }>({
            query: ({ id, teacherId }) => ({
                url: `/dashboard/lectures/${id}/assign`,
                method: 'PUT',
                body: { teacherId },
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Lectures', id },
                { type: 'Lectures', id: 'LIST' },
            ],
        }),

        updateLectureStatus: builder.mutation<ApiResponse<Lecture>, { id: number; status: string; notes?: string }>({
            query: ({ id, status, notes }) => ({
                url: `/dashboard/lectures/${id}/status`,
                method: 'PUT',
                body: { status, notes },
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Lectures', id },
                { type: 'Lectures', id: 'LIST' },
            ],
        }),

        deleteLecture: builder.mutation<ApiResponse<void>, number>({
            query: (id) => ({
                url: `/dashboard/lectures/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Lectures', id: 'LIST' }, 'Dashboard'],
        }),
    }),
});

export const {
    useGetLecturesQuery,
    useGetLectureByIdQuery,
    useCreateLectureMutation,
    useCreateBulkLecturesMutation,
    useUpdateLectureMutation,
    useAssignTeacherMutation,
    useUpdateLectureStatusMutation,
    useDeleteLectureMutation,
} = lecturesApi;
