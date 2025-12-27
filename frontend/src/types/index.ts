// Auth Types
export interface User {
    id: number;
    name: string;
    email: string;
    role?: 'Admin' | 'Teacher' | 'Student';
    createdAt?: string;
    updatedAt?: string;
}

export interface LoginResponse {
    user: User;
    token: string;
    message?: string;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

// Batch Types
export interface Batch {
    id: number;
    name: string;
    timings: {
        days: string[];
        time: string;
    };
    totalStudents: {
        capacity: number;
        enrolled: number;
    };
    createdAt?: string;
    updatedAt?: string;
    status?: 'Active' | 'Inactive' | 'Draft';
}

// Student Types
export interface Student {
    id: number;
    name: string;
    email: string;
    batchId: number;
    firstname: string;
    lastname: string;
    middletname?: string;
    dob?: string;
    address?: string;
    createdAt?: string;
    joinDate?: string;
    status?: 'Active' | 'Inactive' | 'Payment Due';
}

export interface EnrollStudentRequest {
    name: string;
    email: string;
    batchId: number;
    firstname: string;
    lastname: string;
    middletname?: string;
    dob?: string;
    address?: string;
}

// Attendance Types
export interface AttendanceRecord {
    id: number;
    studentId: number;
    batchId: number;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    markedBy: string;
    markedById: number;
    method: 'MANUAL' | 'QR_CODE' | 'AUTO';
    createdAt?: string;
}

export interface AttendanceSheet {
    id: number;
    batchId: number;
    month: number;
    year: number;
    records: AttendanceRecord[];
}

export interface MarkAttendanceRequest {
    studentId: number;
    batchId: number;
    date: string;
    markedBy: string;
    markedById: number;
    method: 'MANUAL' | 'QR_CODE' | 'AUTO';
    status: 'PRESENT' | 'ABSENT' | 'LATE';
}

// Video Types
export interface Video {
    id: number;
    title: string;
    description?: string;
    category?: string;
    visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    url: string;
    batchId?: number;
    createdAt?: string;
    updatedAt?: string;
    // Frontend display fields
    batch?: string;
    duration?: string;
    views?: number;
    date?: string;
    thumbnail?: string;
}

export interface UploadVideoRequest {
    title: string;
    description?: string;
    category?: string;
    visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    url: string;
    batchId?: number;
}

// Note Types
export interface Note {
    id: number;
    title: string;
    content?: string[]; // Array of URLs (images, documents)
    batchId?: number;
    category?: string;
    createdAt?: string;
    updatedAt?: string;
    isDeleted?: boolean;
    // Frontend display fields (computed)
    batch?: string;
    size?: string;
    downloads?: number;
    date?: string;
}

export interface CreateNoteInput {
    title: string;
    content?: string[]; // Array of URLs
    batchId: number;
    category?: string;
}

export interface UpdateNoteInput {
    title?: string;
    content?: string[];
    batchId?: number;
    category?: string;
}

