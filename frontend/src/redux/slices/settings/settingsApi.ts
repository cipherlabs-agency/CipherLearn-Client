import { api } from '../../api/api';

export interface OnboardingQrPayload {
    v: number;
    api: string;
    name: string;
    primary: string;
    accent: string;
    logo?: string;
}

export interface OnboardingQrData {
    payload: OnboardingQrPayload;
    qrDataUrl: string;
}

export interface TeacherPermissions {
    canManageLectures: boolean;
    canUploadNotes: boolean;
    canUploadVideos: boolean;
    canManageAssignments: boolean;
    canViewFees: boolean;
    canManageStudyMaterials: boolean;
    canSendAnnouncements: boolean;
    canViewAnalytics: boolean;
    canExportData: boolean;
}

export interface AppSettings {
    id: number;
    className: string;
    classEmail: string;
    classPhone: string;
    classAddress: string;
    classWebsite: string;
    teacherPermissions: TeacherPermissions;
    updatedAt: string;
}

export interface UpdateSettingsInput {
    className?: string;
    classEmail?: string;
    classPhone?: string;
    classAddress?: string;
    classWebsite?: string;
    teacherPermissions?: Partial<TeacherPermissions>;
}

export const settingsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getSettings: builder.query<AppSettings, void>({
            query: () => '/dashboard/settings',
            providesTags: ['Settings'],
            transformResponse: (response: { success: boolean; data: AppSettings }) => response.data,
        }),
        updateSettings: builder.mutation<AppSettings, UpdateSettingsInput>({
            query: (body) => ({
                url: '/dashboard/settings',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Settings'],
            transformResponse: (response: { success: boolean; data: AppSettings }) => response.data,
        }),
        resetTeacherPermissions: builder.mutation<AppSettings, void>({
            query: () => ({
                url: '/dashboard/settings/reset-teacher-permissions',
                method: 'POST',
            }),
            invalidatesTags: ['Settings'],
            transformResponse: (response: { success: boolean; data: AppSettings }) => response.data,
        }),
        getOnboardingQr: builder.query<OnboardingQrData, void>({
            query: () => '/app/onboarding-qr',
            transformResponse: (response: { success: boolean; data: OnboardingQrData }) => response.data,
        }),
    }),
});

export const {
    useGetSettingsQuery,
    useUpdateSettingsMutation,
    useResetTeacherPermissionsMutation,
    useGetOnboardingQrQuery,
} = settingsApi;
