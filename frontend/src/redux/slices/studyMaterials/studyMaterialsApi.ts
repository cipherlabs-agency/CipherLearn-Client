import { api, ApiResponse, PaginationInfo } from '../../api/api';

// Types
export interface BatchInfo {
    id: number;
    name: string;
}

export interface StudyMaterial {
    id: number;
    title: string;
    description: string | null;
    files: string[];
    batchId: number;
    batch: BatchInfo;
    category: string | null;
    createdBy: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GetStudyMaterialsParams {
    batchId?: number;
    category?: string;
    page?: number;
    limit?: number;
}

export interface StudyMaterialsResponse {
    success: boolean;
    data: StudyMaterial[];
    pagination: PaginationInfo;
}

export interface StudyMaterialResponse {
    success: boolean;
    data: StudyMaterial;
    message?: string;
}

export interface CategoriesResponse {
    success: boolean;
    data: string[];
}

export const studyMaterialsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getStudyMaterials: builder.query<StudyMaterialsResponse, GetStudyMaterialsParams | void>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params?.batchId) queryParams.append('batchId', params.batchId.toString());
                if (params?.category) queryParams.append('category', params.category);
                if (params?.page) queryParams.append('page', params.page.toString());
                if (params?.limit) queryParams.append('limit', params.limit.toString());

                const queryString = queryParams.toString();
                return `/dashboard/study-materials${queryString ? `?${queryString}` : ''}`;
            },
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'StudyMaterials' as const, id })),
                        { type: 'StudyMaterials', id: 'LIST' },
                    ]
                    : [{ type: 'StudyMaterials', id: 'LIST' }],
        }),

        getStudyMaterialById: builder.query<StudyMaterialResponse, number>({
            query: (id) => `/dashboard/study-materials/${id}`,
            providesTags: (result, error, id) => [{ type: 'StudyMaterials', id }],
        }),

        getStudyMaterialCategories: builder.query<CategoriesResponse, void>({
            query: () => '/dashboard/study-materials/categories',
            providesTags: [{ type: 'StudyMaterials', id: 'CATEGORIES' }],
        }),

        createStudyMaterial: builder.mutation<StudyMaterialResponse, FormData>({
            query: (formData) => ({
                url: '/dashboard/study-materials',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: [
                { type: 'StudyMaterials', id: 'LIST' },
                { type: 'StudyMaterials', id: 'CATEGORIES' },
            ],
        }),

        updateStudyMaterial: builder.mutation<StudyMaterialResponse, { id: number; formData: FormData }>({
            query: ({ id, formData }) => ({
                url: `/dashboard/study-materials/${id}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'StudyMaterials', id },
                { type: 'StudyMaterials', id: 'LIST' },
                { type: 'StudyMaterials', id: 'CATEGORIES' },
            ],
        }),

        deleteStudyMaterial: builder.mutation<ApiResponse<null>, number>({
            query: (id) => ({
                url: `/dashboard/study-materials/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'StudyMaterials', id },
                { type: 'StudyMaterials', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetStudyMaterialsQuery,
    useGetStudyMaterialByIdQuery,
    useGetStudyMaterialCategoriesQuery,
    useCreateStudyMaterialMutation,
    useUpdateStudyMaterialMutation,
    useDeleteStudyMaterialMutation,
} = studyMaterialsApi;
