import { api } from '../../api/api';

export const authApi = api.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['Auth'],
        }),
        updateProfile: builder.mutation({
            query: (data) => ({
                url: '/auth/profile',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Auth'],
        }),
        signup: builder.mutation({
            query: (userData) => ({
                url: '/auth/signup',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['Auth'],
        }),
        checkEmail: builder.mutation({
            query: (email: string) => ({
                url: '/auth/check-email',
                method: 'POST',
                body: { email },
            }),
        }),
        resetPassword: builder.mutation({
            query: (data: { email: string; newPassword: string }) => ({
                url: '/auth/reset-password',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Auth'],
        }),
    }),
});

export const { 
    useLoginMutation, 
    useSignupMutation, 
    useUpdateProfileMutation, 
    useResetPasswordMutation,
    useCheckEmailMutation
} = authApi;
