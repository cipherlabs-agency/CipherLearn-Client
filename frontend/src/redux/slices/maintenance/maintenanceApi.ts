import { api } from '../../api/api';

interface MaintenanceStatus {
    students: number;
    users: number;
    batches: number;
    attendances: number;
    lectures: number;
    feeStructures: number;
    feeReceipts: number;
    tests: number;
    testScores: number;
    notes: number;
    youtubeVideos: number;
    assignments: number;
    studyMaterials: number;
}

interface SeededStudent {
    name: string;
    email: string;
    password: string;
    batchName: string;
}

interface SeedResult {
    summary: Record<string, number>;
    students: SeededStudent[];
}

export const maintenanceApi = api.injectEndpoints({
    endpoints: (builder) => ({
        maintenanceAuth: builder.mutation<{ success: boolean }, { password: string }>({
            query: (body) => ({
                url: '/dashboard/maintenance/auth',
                method: 'POST',
                body,
            }),
        }),
        maintenanceSeed: builder.mutation<{ data: SeedResult }, { password: string; count: number; batchId?: number }>({
            query: (body) => ({
                url: '/dashboard/maintenance/seed',
                method: 'POST',
                body,
            }),
        }),
        maintenanceStatus: builder.query<MaintenanceStatus, void>({
            query: () => '/dashboard/maintenance/status',
            transformResponse: (response: { data: MaintenanceStatus }) => response.data,
        }),
        maintenanceCleanup: builder.mutation<{ data: Record<string, number> }, { password: string }>({
            query: (body) => ({
                url: '/dashboard/maintenance/cleanup',
                method: 'DELETE',
                body,
            }),
        }),
    }),
});

export const {
    useMaintenanceAuthMutation,
    useMaintenanceSeedMutation,
    useMaintenanceStatusQuery,
    useMaintenanceCleanupMutation,
} = maintenanceApi;

export type { MaintenanceStatus, SeededStudent, SeedResult };
