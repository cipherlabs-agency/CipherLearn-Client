import { api, ApiResponse, PaginationInfo } from "../../api/api";

// Types
export interface AssignmentSlot {
  id: number;
  title: string;
  subject: string;
  description: string | null;
  batchId: number;
  batch: { id: number; name: string };
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  _count?: { submissions: number };
  submissions?: StudentSubmission[];
}

export interface StudentSubmission {
  id: number;
  slotId: number;
  slot?: {
    id: number;
    title: string;
    subject: string;
    dueDate: string | null;
  };
  studentId: number;
  student?: {
    id: number;
    fullname: string;
    email: string;
  };
  files: string[];
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  feedback: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface CreateSlotInput {
  title: string;
  subject: string;
  description?: string;
  batchId: number;
  dueDate?: string;
}

export interface UpdateSlotInput {
  title?: string;
  subject?: string;
  description?: string;
  batchId?: number;
  dueDate?: string;
}

export interface ReviewSubmissionInput {
  status: "ACCEPTED" | "REJECTED";
  feedback?: string;
}

export interface SubmissionStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

// Response types
interface SlotsResponse {
  success: boolean;
  data: AssignmentSlot[];
  pagination: PaginationInfo;
}

interface SlotResponse {
  success: boolean;
  data: AssignmentSlot;
  message?: string;
}

interface SubmissionsResponse {
  success: boolean;
  data: StudentSubmission[];
  pagination: PaginationInfo;
}

interface SubmissionResponse {
  success: boolean;
  data: StudentSubmission;
  message?: string;
}

interface StatsResponse {
  success: boolean;
  data: SubmissionStats;
}

interface GetSlotsParams {
  batchId?: number;
  page?: number;
  limit?: number;
  includeExpired?: boolean;
}

interface GetSubmissionsParams {
  slotId?: number;
  studentId?: number;
  status?: "PENDING" | "ACCEPTED" | "REJECTED";
  page?: number;
  limit?: number;
}

export const assignmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== SLOTS ====================

    getSlots: builder.query<SlotsResponse, GetSlotsParams | void>({
      query: (params) => ({
        url: "/dashboard/assignments/slots",
        params: params || {},
      }),
      providesTags: ["Assignments"],
    }),

    getSlotById: builder.query<AssignmentSlot, number>({
      query: (id) => `/dashboard/assignments/slots/${id}`,
      transformResponse: (response: SlotResponse) => response.data,
      providesTags: ["Assignments"],
    }),

    createSlot: builder.mutation<SlotResponse, CreateSlotInput>({
      query: (body) => ({
        url: "/dashboard/assignments/slots",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Assignments"],
    }),

    updateSlot: builder.mutation<SlotResponse, { id: number; data: UpdateSlotInput }>({
      query: ({ id, data }) => ({
        url: `/dashboard/assignments/slots/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Assignments"],
    }),

    deleteSlot: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/dashboard/assignments/slots/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Assignments"],
    }),

    getSlotStats: builder.query<SubmissionStats, number>({
      query: (slotId) => `/dashboard/assignments/slots/${slotId}/stats`,
      transformResponse: (response: StatsResponse) => response.data,
      providesTags: ["Assignments", "Submissions"],
    }),

    // ==================== SUBMISSIONS ====================

    getSubmissions: builder.query<SubmissionsResponse, GetSubmissionsParams | void>({
      query: (params) => ({
        url: "/dashboard/assignments/submissions",
        params: params || {},
      }),
      providesTags: ["Submissions"],
    }),

    getSubmissionById: builder.query<StudentSubmission, number>({
      query: (id) => `/dashboard/assignments/submissions/${id}`,
      transformResponse: (response: SubmissionResponse) => response.data,
      providesTags: ["Submissions"],
    }),

    getMySubmission: builder.query<StudentSubmission | null, { slotId: number; studentId: number }>({
      query: ({ slotId, studentId }) => ({
        url: `/dashboard/assignments/slots/${slotId}/my-submission`,
        params: { studentId },
      }),
      transformResponse: (response: { success: boolean; data: StudentSubmission | null }) => response.data,
      providesTags: ["Submissions"],
    }),

    submitAssignment: builder.mutation<SubmissionResponse, FormData>({
      query: (formData) => ({
        url: "/dashboard/assignments/submissions",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Submissions", "Assignments"],
    }),

    reviewSubmission: builder.mutation<SubmissionResponse, { id: number; data: ReviewSubmissionInput }>({
      query: ({ id, data }) => ({
        url: `/dashboard/assignments/submissions/${id}/review`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Submissions", "Assignments"],
    }),

    getStudentAssignmentStats: builder.query<SubmissionStats, number>({
      query: (studentId) => `/dashboard/assignments/students/${studentId}/stats`,
      transformResponse: (response: StatsResponse) => response.data,
    }),
  }),
});

export const {
  useGetSlotsQuery,
  useGetSlotByIdQuery,
  useCreateSlotMutation,
  useUpdateSlotMutation,
  useDeleteSlotMutation,
  useGetSlotStatsQuery,
  useGetSubmissionsQuery,
  useGetSubmissionByIdQuery,
  useGetMySubmissionQuery,
  useSubmitAssignmentMutation,
  useReviewSubmissionMutation,
  useGetStudentAssignmentStatsQuery,
} = assignmentsApi;
