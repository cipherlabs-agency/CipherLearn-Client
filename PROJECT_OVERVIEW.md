# CipherLearn - Smart Tuition Management Platform

## Project Description

CipherLearn is a comprehensive tuition center management application designed to help educators and tuition centers manage their daily operations efficiently. The platform provides features for student enrollment, batch management, attendance tracking, notes/document management, and video lecture organization.

The application follows a modern full-stack architecture with a Next.js frontend and Express.js backend, utilizing PostgreSQL as the database with Prisma ORM.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **State Management**: Redux Toolkit with RTK Query
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives with custom components
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Notifications**: Sonner (toast notifications)
- **Icons**: Lucide React
- **Theme**: next-themes (dark/light mode support)

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5
- **ORM**: Prisma with PostgreSQL adapter
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **File Upload**: Multer + Cloudinary
- **Logging**: Winston + Morgan
- **File Storage**: Cloudinary (images, documents)

---

## Project Structure

```
CipherLearn/client/
├── backend/                    # Express.js Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── generated/          # Prisma client (auto-generated)
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   │   ├── app.config.ts   # CORS options
│   │   │   ├── cloudinairy.config.ts # Cloudinary setup
│   │   │   ├── db.config.ts    # Database connection
│   │   │   ├── env.config.ts   # Environment variables
│   │   │   ├── error.config.ts # Error codes
│   │   │   └── multer.config.ts # File upload config
│   │   ├── middleware/
│   │   │   └── httpLogger.ts   # HTTP request logging
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication module
│   │   │   │   ├── controller.auth.ts
│   │   │   │   ├── middleware.ts
│   │   │   │   ├── routes.auth.ts
│   │   │   │   ├── service.auth.ts
│   │   │   │   ├── types.auth.ts
│   │   │   │   ├── utils.auth.ts
│   │   │   │   └── validations.auth.ts
│   │   │   └── dashboard/      # Dashboard modules
│   │   │       ├── analytics/
│   │   │       ├── attendance/
│   │   │       ├── batches/
│   │   │       ├── fees/       (placeholder)
│   │   │       ├── notes/
│   │   │       ├── student-enrollment/
│   │   │       ├── youtube-videos/
│   │   │       └── routes.ts
│   │   ├── utils/
│   │   │   └── logger.ts       # Winston logger
│   │   ├── globals.ts          # Global type augmentation
│   │   ├── index.ts            # Entry point
│   │   ├── routes.ts           # Main router
│   │   └── server.ts           # Express app setup
│   └── package.json
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Auth pages (login, signup)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── (pages)/        # Protected pages
│   │   │   │   ├── layout.tsx  # Dashboard layout with sidebar
│   │   │   │   ├── attendance/page.tsx
│   │   │   │   ├── batches/page.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── notes/page.tsx
│   │   │   │   ├── students/page.tsx
│   │   │   │   └── videos/page.tsx
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Landing (redirects to login)
│   │   ├── components/
│   │   │   ├── ui/             # Reusable UI components
│   │   │   ├── layout/         # Sidebar, Navbar
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── attendance/     # Attendance components
│   │   │   ├── batches/        # Batch components
│   │   │   ├── notes/          # Notes components
│   │   │   ├── students/       # Student components
│   │   │   └── videos/         # Video components
│   │   ├── redux/
│   │   │   ├── api/api.ts      # RTK Query base API
│   │   │   ├── slices/         # Feature slices
│   │   │   │   ├── auth/
│   │   │   │   ├── analytics/
│   │   │   │   ├── attendance/
│   │   │   │   ├── batches/
│   │   │   │   ├── notes/
│   │   │   │   ├── students/
│   │   │   │   └── videos/
│   │   │   ├── constants/tags.ts
│   │   │   ├── hooks.ts
│   │   │   ├── provider.tsx
│   │   │   └── store.ts
│   │   ├── lib/utils.ts        # Utility functions
│   │   └── types/index.ts      # TypeScript types
│   └── package.json
│
├── docs/                       # Documentation
├── postman/                    # Postman collection
└── PROJECT_OVERVIEW.md         # This file
```

---

## Features

### 1. Authentication System
- **User Registration**: Sign up with name, email, and password
- **User Login**: JWT-based authentication
- **Password Reset**: Request password reset and reset password
- **Profile Update**: Update user name and email
- **Role-Based Access**: ADMIN, TEACHER, STUDENT roles
- **Admin Detection**: Auto-assigns ADMIN role for specified admin emails
- **Protected Routes**: Frontend route guards and backend middleware

### 2. Dashboard & Analytics
- **KPI Stats**: Total students, total batches, active batches
- **Charts**: Revenue and attendance visualization (placeholder data)
- **Activity Feed**: Recent activities display
- **Student Distribution**: Visual representation of student data

### 3. Batch Management
- **Create Batch**: Name, schedule (days/time), capacity
- **View Batches**: List all batches with details
- **Update Batch**: Edit batch information
- **Soft Delete**: Move batches to drafts
- **Hard Delete**: Permanently delete batches

### 4. Student Enrollment
- **Single Enrollment**: Enroll individual students with full details
- **CSV Import**: Bulk enrollment via CSV upload (placeholder)
- **View Students**: List students by batch
- **Student Details**: First name, middle name, last name, email, DOB, address

### 5. Attendance Tracking
- **Create Attendance Sheet**: Monthly attendance sheets per batch
- **Mark Attendance**: Manual attendance marking (PRESENT/ABSENT)
- **QR Attendance**: QR code-based attendance (placeholder)
- **Attendance Matrix**: View student attendance for a month
- **Batch Attendance**: View all attendance records for a batch

### 6. Notes/Study Material
- **Upload Notes**: Upload documents with file validation
- **File Support**: PDF, DOC, DOCX, PPT, PPTX, images, text files
- **Cloudinary Storage**: Files stored in Cloudinary
- **Security**: Magic number validation for file types
- **CRUD Operations**: Create, read, update, soft delete notes
- **Pagination**: Paginated notes listing

### 7. Video Lectures
- **Add Videos**: Upload YouTube video links
- **Visibility**: PUBLIC, PRIVATE, UNLISTED options
- **Categorization**: Category and batch assignment
- **View Videos**: Grid display of video lectures
- **Soft Delete**: Draft/archive videos

---

## API Endpoints Summary

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | User login |
| POST | `/logout` | User logout |
| POST | `/request-password-reset` | Request password reset |
| POST | `/reset-password` | Reset password |
| PUT | `/profile` | Update user profile (authenticated) |

### Analytics (`/api/dashboard/analytics`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/batch-count` | Get total batches count |
| GET | `/student-count` | Get total students count |
| GET | `/batch/:batchId/student-count` | Get student count for batch |
| GET | `/batch/:batchId/attendance/day` | Get daily attendance matrix |
| GET | `/batch/:batchId/attendance/month` | Get monthly attendance matrix |

### Batches (`/api/dashboard/batches`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all batches |
| POST | `/` | Create new batch |
| GET | `/:id` | Get batch by ID |
| PUT | `/:id` | Update batch |
| DELETE | `/` | Delete batches (body: { ids: [] }) |
| PUT | `/draft` | Move batches to draft |
| GET | `/drafts` | Get draft batches |

### Student Enrollment (`/api/dashboard/student-enrollment`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/enroll` | Enroll single student |
| POST | `/enroll-with-csv` | Bulk enroll via CSV |
| GET | `/students/:id` | Get students by batch ID |

### Attendance (`/api/dashboard/attendance`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-attendance-sheet` | Create attendance sheet |
| POST | `/mark-attendance` | Mark student attendance |
| GET | `/batch-attendance-sheet/:batchId` | Get batch attendance |
| GET | `/student-attendance-matrix/:studentId` | Get student attendance matrix |

### Notes (`/api/dashboard/notes`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all notes (paginated) |
| POST | `/` | Create note with files |
| GET | `/:id` | Get note by ID |
| PUT | `/:id` | Update note |
| DELETE | `/:id` | Soft delete note |

### YouTube Videos (`/api/dashboard/youtube-videos`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all videos |
| POST | `/upload` | Add new video |
| PUT | `/:videoId` | Draft/archive video |

---

## Database Schema

### Models
- **User**: id, name, email, password, role, timestamps
- **Student**: id, firstname, middlename, lastname, fullname, email, dob, batchId, address, timestamps
- **Batch**: id, name, totalStudents (JSON), timings (JSON), isDeleted, deletedBy, timestamps
- **AttendanceSheet**: id, batchId, month, year, timestamps
- **Attendance**: id, studentId, batchId, date, time, markedBy, markedById, method, status, attendanceSheetId, timestamps
- **YoutubeVideo**: id, title, description, url, visibility, category, batchId, isDeleted, deletedBy, timestamps
- **Note**: id, title, content (array), batchId, category, isDeleted, deletedBy, deletedAt, timestamps

### Enums
- **UserRoles**: ADMIN, TEACHER, STUDENT
- **AttendanceMethod**: MANUAL, QR
- **AttendanceStatus**: PRESENT, ABSENT
- **YoutubeVideoVisibility**: PUBLIC, PRIVATE, UNLISTED

---

## Issues Found and Fixed

### 1. Missing Import in Attendance Service
**File**: `backend/src/modules/dashboard/attendance/service.ts`
**Issue**: The service was using `getMonthRangeInUTC` and `toIntOrDefault` functions without importing them.
**Fix**: Added import statement for utility functions from `./utils`.

### 2. Utility Functions Not Exported
**File**: `backend/src/modules/dashboard/attendance/utils.ts`
**Issue**: Functions were defined but not exported.
**Fix**: Added `export` keyword to both functions.

### 3. Frontend API Endpoint Mismatch - Get Students
**File**: `frontend/src/redux/slices/students/studentsApi.ts`
**Issue**: Frontend was calling `/dashboard/batches/${batchId}` to get students, but the backend endpoint is `/dashboard/student-enrollment/students/:id`.
**Fix**: Updated the endpoint URL to match the backend.

### 4. Frontend API Endpoint Mismatch - Delete Batch
**File**: `frontend/src/redux/slices/batches/batchesApi.ts`
**Issue**: Frontend was sending DELETE to `/dashboard/batches/${id}`, but backend expects DELETE to `/dashboard/batches` with `{ ids: [] }` in body.
**Fix**: Updated the mutation to send correct request format.

### 5. Frontend API Method Mismatch - Draft Batch
**File**: `frontend/src/redux/slices/batches/batchesApi.ts`
**Issue**: Frontend was using POST method for draft batch, but backend expects PUT.
**Fix**: Changed method from POST to PUT.

### 6. Unnecessary Debug File
**File**: `backend/check-users.ts`
**Issue**: Debug file for checking users in database - not needed in production.
**Fix**: Deleted the file.

---

## Potential Improvements

1. **Student Delete Endpoint**: Frontend has a delete student button, but backend lacks the corresponding delete endpoint.

2. **Fees Module**: The fees module files exist but are empty placeholders.

3. **QR Attendance**: The QR attendance functionality is a placeholder - needs implementation.

4. **Email Integration**: Password reset generates a token but doesn't send an email (noted as dev/test convenience).

5. **Google OAuth**: Login/signup pages have Google OAuth buttons but no backend implementation.

6. **Settings Page**: Sidebar has settings link but no settings page exists.

7. **Announcements**: Tag type defined but no announcements module implemented.

8. **Explore & Contact Pages**: Pages exist in frontend but appear to be placeholder/standalone.

9. **CSV Import**: Student CSV import is a placeholder - needs full implementation.

---

## Environment Variables Required

### Backend (.env)
```
APP_PORT=5000
APP_HOST=localhost
NODE_ENV=development
CLIENT_URL=http://localhost:3000
SALT=10
ADMIN_EMAILS=admin@example.com

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=cipherlearn
DB_URL=postgresql://user:password@host:5432/database

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Getting Started

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Architecture Notes

The project follows the MVC (Model-View-Controller) pattern:

- **Models**: Prisma schema and generated client handle data layer
- **Services**: Business logic layer handling data operations
- **Controllers**: Request/response handling, orchestrating services
- **Routes**: API endpoint definitions with validation middleware
- **Views**: React components in the frontend

Each backend module follows a consistent structure:
- `route.ts` - Express routes with middleware
- `controller.ts` - Request handlers
- `service.ts` - Business logic
- `types.ts` - TypeScript interfaces
- `validation.ts` - Joi validation schemas

The frontend uses RTK Query for API calls with automatic caching, refetching, and state management.

---

## Author

CipherLearn - Smart Tuition Management Platform

---

*Last Updated: January 2026*
