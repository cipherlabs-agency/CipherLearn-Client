// ============================================
// API Response Types (Backend Contract)
// ============================================

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface ApiError {
    success: false;
    message: string;
    error?: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ============================================
// Auth Types
// ============================================

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    createdAt: string;
    updatedAt: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        token: string;
    };
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

// ============================================
// Batch Types (Matching Prisma Schema)
// ============================================

export interface BatchTimings {
    days: string[];
    time: string;
}

export interface BatchTotalStudents {
    capacity: number;
    enrolled: number;
}

export interface Batch {
    id: number;
    name: string;
    timings: BatchTimings;
    totalStudents: BatchTotalStudents | number;
    isDeleted: boolean;
    deletedBy: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface BatchesApiResponse {
    success: boolean;
    message: string;
    data: Batch[];
}

export interface CreateBatchInput {
    name: string;
    timings: BatchTimings;
    totalStudents: BatchTotalStudents;
}

// ============================================
// Student Types (Matching Prisma Schema)
// ============================================

export interface Student {
    id: number;
    firstname: string;
    middlename: string | null;
    lastname: string;
    fullname: string;
    email: string;
    dob: string;
    batchId: number;
    address: string | null;
    createdAt: string;
    updatedAt: string;
}

// Student profile with batch info (returned by my-profile endpoint)
export interface StudentProfile extends Student {
    batch?: {
        id: number;
        name: string;
    };
}

export interface StudentsApiResponse {
    success: boolean;
    message?: string;
    data?: Student[];
    students?: Student[]; // Some endpoints return this
}

export interface EnrollStudentInput {
    firstname: string;
    middlename?: string;
    lastname: string;
    email: string;
    dob: string;
    batchId: number;
    address?: string;
}

// ============================================
// Attendance Types (Matching Prisma Schema)
// ============================================

export type AttendanceStatus = 'PRESENT' | 'ABSENT';
export type AttendanceMethod = 'MANUAL' | 'QR';

export interface AttendanceStudent {
    id: number;
    fullname: string;
    email: string;
}

export interface AttendanceRecord {
    id: number;
    studentId: number;
    batchId: number;
    date: string;
    time: string | null;
    markedBy: string | null;
    markedById: number | null;
    method: AttendanceMethod;
    status: AttendanceStatus;
    attendanceSheetId: number | null;
    createdAt: string;
    updatedAt: string;
    student?: AttendanceStudent;
}

export interface AttendanceSheet {
    id: number;
    batchId: number;
    month: number;
    year: number;
    createdAt: string;
    updatedAt: string;
}

export interface AttendanceApiResponse {
    success: boolean;
    message: string;
    data: AttendanceRecord[];
}

export interface MarkAttendanceInput {
    studentId: number;
    batchId: number;
    date: string;
    status: AttendanceStatus;
    method?: AttendanceMethod;
}

export interface BulkAttendanceInput {
    batchId: number;
    date: string;
    attendances: {
        studentId: number;
        status: AttendanceStatus;
    }[];
}

export interface UpdateAttendanceInput {
    id: number;
    status: AttendanceStatus;
}

export interface StudentAttendanceStats {
    studentId: number;
    studentName: string;
    email: string;
    presentDays: number;
    absentDays: number;
    totalDays: number;
    percentage: number;
}

export interface AttendanceReportParams {
    batchId: number;
    startDate: string;
    endDate: string;
}

export interface AttendanceReport {
    batchId: number;
    batchName: string;
    startDate: string;
    endDate: string;
    totalStudents: number;
    overallAttendancePercentage: number;
    studentStats: StudentAttendanceStats[];
}

export interface AttendanceMatrixData {
    month: number;
    year: number;
    days: Array<{
        date: string;
        status: AttendanceStatus | null;
    }>;
}

export interface QRCodeData {
    batchId: number;
    batchName: string;
    qrData: string;
    qrImageBase64: string;
    validFor: string;
    expiresAt: string;
    isExisting?: boolean;
    tokenId?: number;
}

export interface QRCodeStatusData {
    exists: boolean;
    batchId: number;
    batchName: string;
    date: string;
    expiresAt?: string;
    isActive?: boolean;
    isExpired?: boolean;
    tokenId?: number;
    createdAt?: string;
    message?: string;
}

export interface MarkQRAttendanceInput {
    studentId: number;
    qrData: string;
}

export interface GenerateQRCodeParams {
    batchId: number;
    regenerate?: boolean;
}

// ============================================
// Video Types (Matching Prisma Schema)
// ============================================

export type VideoVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

export interface YoutubeVideo {
    id: number;
    title: string;
    description: string | null;
    url: string;
    visibility: VideoVisibility;
    category: string | null;
    batchId: number;
    batch?: {
        id: number;
        name: string;
    };
    thumbnailUrl?: string;
    duration?: string;
    isDeleted: boolean;
    deletedBy: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface VideosApiResponse {
    success: boolean;
    message: string;
    data: YoutubeVideo[];
}

export interface CreateVideoInput {
    title: string;
    description?: string;
    url: string;
    visibility?: VideoVisibility;
    category?: string;
    batchId: number;
}

export interface UpdateVideoInput {
    title?: string;
    description?: string;
    url?: string;
    visibility?: VideoVisibility;
    category?: string;
    batchId?: number;
}

export interface VideosQueryParams {
    batchId?: number;
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
}

export interface VideosListResponse {
    videos: YoutubeVideo[];
    pagination: PaginationInfo;
}

export interface CategoriesResponse {
    success: boolean;
    data: string[];
}

// ============================================
// Note Types (Matching Prisma Schema)
// ============================================

// ============================================
// Note Types (Matching Prisma Schema)
// ============================================

export interface NoteFile {
    id: number;
    url: string;
    filename: string;
    mimetype: string;
    size: number;
}

export interface Note {
    id: number;
    title: string;
    content: string[]; // Array of file URLs
    batchId: number;
    category: string | null;
    files?: NoteFile[];
    isDeleted: boolean;
    deletedBy: number | null;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface NotesApiResponse {
    success: boolean;
    message: string;
    data: Note[];
    pagination?: PaginationInfo;
}

export interface CreateNoteInput {
    title: string;
    content?: string[];
    batchId: number;
    category?: string;
    // Files handled via FormData
}

export interface UpdateNoteInput {
    title?: string;
    content?: string[];
    batchId?: number;
    category?: string;
}

export interface NotesQueryParams {
    batchId?: number;
    category?: string;
    page?: number;
    limit?: number;
}

export interface NotesListResponse {
    notes: Note[];
    pagination: PaginationInfo;
}

// ============================================
// Analytics/Dashboard Types
// ============================================

export interface StudentCount {
    success: boolean;
    message: string;
    data: {
        count: number;
    };
}

export interface BatchCount {
    success: boolean;
    message: string;
    data: {
        count: number;
    };
}

export interface AttendanceMatrix {
    success: boolean;
    message: string;
    data: {
        [key: string]: AttendanceStatus;
    };
}

// ============================================
// CSV Import/Export Types
// ============================================

export interface CSVPreviewRow {
    firstname: string;
    middlename?: string;
    lastname: string;
    email: string;
    dob: string;
    address?: string;
}

export interface CSVError {
    row: number;
    email?: string;
    error: string;
}

export interface CSVPreviewData {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    preview: CSVPreviewRow[];
    errors: CSVError[];
}

export interface CSVImportResult {
    total: number;
    successful: number;
    failed: number;
    errors: CSVError[];
    imported: Student[];
}

// ============================================
// Fee Management Types
// ============================================

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE';
export type FeeFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'ONE_TIME';

export interface FeeStructure {
    id: number;
    batchId: number;
    name: string;
    amount: number;
    frequency: FeeFrequency;
    dueDay: number;
    lateFee: number;
    gracePeriod: number;
    isActive: boolean;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface FeeReceipt {
    id: number;
    receiptNumber: string;
    studentId: number;
    batchId: number;
    feeStructureId: number | null;
    student?: {
        id: number;
        fullname: string;
        email: string;
    } | null;
    batch?: {
        id: number;
        name: string;
    } | null;
    feeStructure?: {
        id: number;
        name: string;
    } | null;
    totalAmount: number;
    paidAmount: number;
    discountAmount: number;
    lateFeeAmount: number;
    remainingAmount: number;
    paymentMode: PaymentMode | null;
    transactionId: string | null;
    chequeNumber: string | null;
    bankName: string | null;
    paymentNotes: string | null;
    academicMonth: number;
    academicYear: number;
    status: PaymentStatus;
    dueDate: string;
    paymentDate: string | null;
    generatedBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFeeStructureInput {
    batchId: number;
    name: string;
    amount: number;
    frequency?: FeeFrequency;
    dueDay?: number;
    lateFee?: number;
    gracePeriod?: number;
    description?: string;
}

export interface UpdateFeeStructureInput {
    name?: string;
    amount?: number;
    frequency?: FeeFrequency;
    dueDay?: number;
    lateFee?: number;
    gracePeriod?: number;
    isActive?: boolean;
    description?: string;
}

export interface CreateFeeReceiptInput {
    studentId: number;
    batchId: number;
    feeStructureId?: number;
    totalAmount: number;
    paidAmount?: number;
    discountAmount?: number;
    lateFeeAmount?: number;
    paymentMode?: PaymentMode;
    transactionId?: string;
    chequeNumber?: string;
    bankName?: string;
    paymentNotes?: string;
    academicMonth: number;
    academicYear: number;
    dueDate: string;
    paymentDate?: string;
}

export interface UpdateFeeReceiptInput {
    paidAmount?: number;
    discountAmount?: number;
    lateFeeAmount?: number;
    paymentMode?: PaymentMode;
    transactionId?: string;
    chequeNumber?: string;
    bankName?: string;
    paymentNotes?: string;
    dueDate?: string;
    paymentDate?: string;
    status?: PaymentStatus;
}

export interface BulkCreateReceiptsInput {
    batchId: number;
    feeStructureId?: number;
    academicMonth: number;
    academicYear: number;
    dueDate: string;
    studentIds?: number[];
}

export interface BulkCreateResult {
    total: number;
    created: number;
    skipped: number;
    errors: string[];
}

export interface FeeReceiptFilters {
    batchId?: number;
    studentId?: number;
    status?: PaymentStatus;
    academicMonth?: number;
    academicYear?: number;
    startDate?: string;
    endDate?: string;
    paymentMode?: PaymentMode;
    page?: number;
    limit?: number;
}

export interface FeeReceiptSummary {
    totalReceipts: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    byStatus: {
        paid: number;
        partial: number;
        pending: number;
        overdue: number;
    };
    byMonth: {
        month: number;
        year: number;
        totalAmount: number;
        collectedAmount: number;
        pendingAmount: number;
    }[];
}

export interface StudentFeesSummary {
    studentId: number;
    studentName: string;
    email: string;
    batchName: string;
    totalDue: number;
    totalPaid: number;
    totalPending: number;
    overdueReceipts: number;
    lastPaymentDate?: string;
}

export interface FeesApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    pagination?: PaginationInfo;
}
