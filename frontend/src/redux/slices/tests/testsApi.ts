import { api, ApiResponse } from '../../api/api';
import {
    Test,
    TestScore,
    CreateTestInput,
    UpdateTestInput,
    UploadScoreInput,
    TestStats,
    BulkScoreResult,
} from '@/types';

interface TestScoresResponse {
    success: boolean;
    data: TestScore[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface TestsListResponse {
    success: boolean;
    data: Test[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface GetTestsParams {
    batchId?: number;
    subject?: string;
    status?: string;
    testType?: string;
    page?: number;
    limit?: number;
}

export const testsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTests: builder.query<{ tests: Test[]; pagination: TestsListResponse['pagination'] }, GetTestsParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params) {
                    if (params.batchId) searchParams.set('batchId', String(params.batchId));
                    if (params.subject) searchParams.set('subject', params.subject);
                    if (params.status) searchParams.set('status', params.status);
                    if (params.testType) searchParams.set('testType', params.testType);
                    if (params.page) searchParams.set('page', String(params.page));
                    if (params.limit) searchParams.set('limit', String(params.limit));
                }
                const qs = searchParams.toString();
                return `/dashboard/tests${qs ? `?${qs}` : ''}`;
            },
            transformResponse: (response: TestsListResponse) => ({
                tests: response.data,
                pagination: response.pagination,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.tests.map(({ id }) => ({ type: 'Tests' as const, id })),
                        { type: 'Tests', id: 'LIST' },
                    ]
                    : [{ type: 'Tests', id: 'LIST' }],
        }),

        getTestById: builder.query<Test, number>({
            query: (id) => `/dashboard/tests/${id}`,
            transformResponse: (response: ApiResponse<Test>) => response.data!,
            providesTags: (_result, _error, id) => [{ type: 'Tests', id }],
        }),

        getTestScores: builder.query<{ scores: TestScore[]; pagination: TestScoresResponse['pagination'] }, { id: number; page?: number; limit?: number }>({
            query: ({ id, page = 1, limit = 50 }) =>
                `/dashboard/tests/${id}/scores?page=${page}&limit=${limit}`,
            transformResponse: (response: TestScoresResponse) => ({
                scores: response.data,
                pagination: response.pagination,
            }),
            providesTags: (_result, _error, { id }) => [
                { type: 'TestScores', id: `test-${id}` },
            ],
        }),

        createTest: builder.mutation<ApiResponse<Test>, CreateTestInput>({
            query: (data) => ({
                url: '/dashboard/tests',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Tests', id: 'LIST' }, 'Dashboard'],
        }),

        updateTest: builder.mutation<ApiResponse<Test>, { id: number; data: UpdateTestInput }>({
            query: ({ id, data }) => ({
                url: `/dashboard/tests/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Tests', id },
                { type: 'Tests', id: 'LIST' },
            ],
        }),

        deleteTest: builder.mutation<ApiResponse<void>, number>({
            query: (id) => ({
                url: `/dashboard/tests/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Tests', id: 'LIST' }, 'Dashboard'],
        }),

        publishTest: builder.mutation<ApiResponse<Test>, number>({
            query: (id) => ({
                url: `/dashboard/tests/${id}/publish`,
                method: 'PUT',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'Tests', id },
                { type: 'Tests', id: 'LIST' },
            ],
        }),

        uploadScore: builder.mutation<ApiResponse<TestScore>, { testId: number; data: UploadScoreInput }>({
            query: ({ testId, data }) => ({
                url: `/dashboard/tests/${testId}/scores`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (_result, _error, { testId }) => [
                { type: 'Tests', id: testId },
                { type: 'TestScores', id: `test-${testId}` },
            ],
        }),

        uploadScoresBulk: builder.mutation<ApiResponse<BulkScoreResult>, { testId: number; formData: FormData }>({
            query: ({ testId, formData }) => ({
                url: `/dashboard/tests/${testId}/scores/bulk`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: (_result, _error, { testId }) => [
                { type: 'Tests', id: testId },
                { type: 'TestScores', id: `test-${testId}` },
            ],
        }),

        updateScore: builder.mutation<ApiResponse<TestScore>, { testId: number; scoreId: number; data: { marksObtained?: number; remarks?: string; status?: string } }>({
            query: ({ testId, scoreId, data }) => ({
                url: `/dashboard/tests/${testId}/scores/${scoreId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (_result, _error, { testId }) => [
                { type: 'Tests', id: testId },
                { type: 'TestScores', id: `test-${testId}` },
            ],
        }),

        getTestStats: builder.query<TestStats, number>({
            query: (id) => `/dashboard/tests/${id}/stats`,
            transformResponse: (response: ApiResponse<TestStats>) => response.data!,
            providesTags: (_result, _error, id) => [{ type: 'TestScores', id: `stats-${id}` }],
        }),
    }),
});

export const {
    useGetTestsQuery,
    useGetTestByIdQuery,
    useGetTestScoresQuery,
    useCreateTestMutation,
    useUpdateTestMutation,
    useDeleteTestMutation,
    usePublishTestMutation,
    useUploadScoreMutation,
    useUploadScoresBulkMutation,
    useUpdateScoreMutation,
    useGetTestStatsQuery,
} = testsApi;
