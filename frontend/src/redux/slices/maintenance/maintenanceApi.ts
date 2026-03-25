import { api } from '../../api/api';

// ── Types ──────────────────────────────────────────────────

export interface SeedStudent {
    name: string;
    email: string;
    password: string;
    batchName: string;
    studentId: number;
}

export interface SeedResult {
    summary: Record<string, number>;
    students: SeedStudent[];
}

export interface SeedDataResult {
    students: {
        id: number; firstname: string; lastname: string; email: string; batchId: number | null;
        batch: { id: number; name: string } | null;
        user: { id: number; email: string } | null;
        _count: { attendances: number; feeReceipts: number; testScores: number };
    }[];
    batches: {
        id: number; name: string; timings: any; createdAt: string;
        _count: { students: number; lectures: number; tests: number; notes: number; feeStructures: number };
    }[];
}

export interface HealthResult {
    total: number; passed: number; failed: number;
    results: { method: string; path: string; module: string; status: number; time: number; passed: boolean; error?: string; responseSize?: string }[];
}

export interface ValidationResult {
    total: number; passed: number; failed: number;
    results: { method: string; path: string; module: string; status: number; passed: boolean; desc: string; serverMessage?: string }[];
}

export interface SecurityResult {
    total: number; passed: number; failed: number;
    results: { test: string; path: string; module: string; status: number; passed: boolean; expected: string }[];
}

export interface DbIntegrityResult {
    total: number; issues: number;
    checks: { name: string; table: string; count: number; passed: boolean; detail: string }[];
}

export interface LoadTestResult {
    endpoint: string; totalRequests: number; successful: number; failed: number;
    avgTime: number; minTime: number; maxTime: number; p95Time: number; requestsPerSecond: number;
    statusCodeBreakdown: Record<number, number>;
}

export interface PlaygroundResult {
    request: { method: string; url: string; headers: Record<string, string>; body: any };
    response: { status: number; time: number; headers: Record<string, string>; body: any };
}

export interface EndpointInfo { method: string; path: string; module: string; }

// ── API ────────────────────────────────────────────────────

export const maintenanceApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        maintenanceAuth: builder.mutation<{ success: boolean }, { password: string }>({
            query: (body) => ({ url: '/dashboard/maintenance/auth', method: 'POST', body }),
        }),
        maintenanceStatus: builder.query<Record<string, number>, void>({
            query: () => '/dashboard/maintenance/status',
            transformResponse: (r: { data: Record<string, number> }) => r.data,
        }),
        maintenanceSeedData: builder.query<SeedDataResult, void>({
            query: () => '/dashboard/maintenance/seed-data',
            transformResponse: (r: { data: SeedDataResult }) => r.data,
        }),
        maintenanceSeed: builder.mutation<{ data: SeedResult }, { password: string; count: number; batchId?: number }>({
            query: (body) => ({ url: '/dashboard/maintenance/seed', method: 'POST', body }),
        }),
        maintenanceCleanup: builder.mutation<{ data: Record<string, number> }, { password: string }>({
            query: (body) => ({ url: '/dashboard/maintenance/cleanup', method: 'DELETE', body }),
        }),
        maintenanceApiHealth: builder.mutation<{ data: HealthResult }, { baseUrl: string; token: string }>({
            query: (body) => ({ url: '/dashboard/maintenance/api-health', method: 'POST', body }),
        }),
        maintenanceValidation: builder.mutation<{ data: ValidationResult }, { baseUrl: string; token: string }>({
            query: (body) => ({ url: '/dashboard/maintenance/validation-audit', method: 'POST', body }),
        }),
        maintenanceSecurity: builder.mutation<{ data: SecurityResult }, { baseUrl: string; token: string }>({
            query: (body) => ({ url: '/dashboard/maintenance/security-audit', method: 'POST', body }),
        }),
        maintenanceDbIntegrity: builder.query<DbIntegrityResult, void>({
            query: () => '/dashboard/maintenance/db-integrity',
            transformResponse: (r: { data: DbIntegrityResult }) => r.data,
        }),
        maintenanceLoadTest: builder.mutation<{ data: LoadTestResult }, { baseUrl: string; token: string; endpoint: string; method?: string; concurrency?: number; iterations?: number }>({
            query: (body) => ({ url: '/dashboard/maintenance/load-test', method: 'POST', body }),
        }),
        maintenancePlayground: builder.mutation<{ data: PlaygroundResult }, { baseUrl: string; token: string; endpoint: string; method?: string; body?: any; customHeaders?: Record<string, string> }>({
            query: (body) => ({ url: '/dashboard/maintenance/playground', method: 'POST', body }),
        }),
        maintenanceEndpoints: builder.query<EndpointInfo[], void>({
            query: () => '/dashboard/maintenance/endpoints',
            transformResponse: (r: { data: EndpointInfo[] }) => r.data,
        }),
        maintenanceTestNotification: builder.mutation<
            { success: boolean; message: string; data?: any },
            { userId?: number; title: string; body: string; data?: Record<string, unknown>; sendToAll?: boolean }
        >({
            query: (body) => ({ url: '/dashboard/maintenance/test-notification', method: 'POST', body }),
        }),
    }),
});

export const {
    useMaintenanceAuthMutation,
    useMaintenanceStatusQuery,
    useMaintenanceSeedDataQuery,
    useMaintenanceSeedMutation,
    useMaintenanceCleanupMutation,
    useMaintenanceApiHealthMutation,
    useMaintenanceValidationMutation,
    useMaintenanceSecurityMutation,
    useMaintenanceDbIntegrityQuery,
    useMaintenanceLoadTestMutation,
    useMaintenancePlaygroundMutation,
    useMaintenanceEndpointsQuery,
    useMaintenanceTestNotificationMutation,
} = maintenanceApi;

