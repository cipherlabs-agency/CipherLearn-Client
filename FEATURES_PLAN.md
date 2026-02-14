# FEATURES_PLAN.md

# CipherLearn — New Features Implementation Plan

This document covers three new features: Lectures, Tests & Scores, and Real-Time Chat.

---

## Table of Contents

1. [Lectures System](#1-lectures-system)
2. [Tests & Scores System](#2-tests--scores-system)
3. [Chat System (WebSocket)](#3-chat-system-websocket)
4. [Database Schema (All New Models)](#4-database-schema-all-new-models)
5. [Backend Implementation](#5-backend-implementation)
6. [Frontend Implementation](#6-frontend-implementation)
7. [App (Mobile) Implementation](#7-app-mobile-implementation)
8. [Scaling Strategy](#8-scaling-strategy)
9. [Dependencies to Install](#9-dependencies-to-install)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Lectures System

### 1.1 What It Does

- Admin creates **Lecture Slots** (subject, topic, date/time, duration, batch)
- Admin assigns lectures to teachers **manually** or via **auto-assign**
- Auto-assign picks the teacher with the fewest lectures that week for the given subject
- Teachers see their assigned lectures in the App (upcoming, past)
- Students see their batch's lecture schedule in the App

### 1.2 Data Model

```prisma
model Lecture {
  id            Int            @id @default(autoincrement())
  title         String                        // "Algebra - Quadratic Equations"
  subject       String                        // "Mathematics"
  description   String?
  batchId       Int
  batch         Batch          @relation(fields: [batchId], references: [id])
  teacherId     Int?                          // NULL = unassigned
  teacher       User?          @relation("TeacherLectures", fields: [teacherId], references: [id])
  assignedBy    String?                       // "admin" | "auto"

  // Schedule
  date          DateTime                      // 2025-06-15
  startTime     String                        // "10:00"
  endTime       String                        // "11:30"
  duration      Int                           // minutes (90)

  // Status
  status        LectureStatus  @default(SCHEDULED)
  notes         String?                       // Teacher's post-lecture notes

  // Recurrence (for auto-creating weekly lectures)
  recurrenceId  String?                       // Groups recurring lectures together

  // Audit
  createdBy     Int
  isDeleted     Boolean        @default(false)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([batchId])
  @@index([teacherId])
  @@index([date])
  @@index([batchId, date])
  @@map("lectures")
}

enum LectureStatus {
  SCHEDULED     // Upcoming
  IN_PROGRESS   // Currently happening
  COMPLETED     // Done
  CANCELLED     // Cancelled by admin
}
```

### 1.3 Auto-Assign Algorithm

When admin creates a lecture without selecting a teacher and enables auto-assign:

```
1. Find all teachers in the system
2. Filter teachers who teach the given subject
   → If no subject match, use all teachers
3. For each candidate teacher, count lectures assigned this week
4. Pick the teacher with the fewest lectures this week
5. On tie, pick the teacher who was assigned least recently
6. Set assignedBy = "auto"
```

If no teachers exist, the lecture is created with `teacherId = null` (unassigned).

### 1.4 API Endpoints

**Dashboard (Admin):**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/dashboard/lectures` | Create lecture (with optional auto-assign) | isAdmin |
| GET | `/dashboard/lectures` | List all lectures (filter by batch, teacher, date range) | isAdminOrTeacher |
| GET | `/dashboard/lectures/:id` | Get lecture detail | isAdminOrTeacher |
| PUT | `/dashboard/lectures/:id` | Update lecture | isAdmin |
| PUT | `/dashboard/lectures/:id/assign` | Assign/reassign teacher | isAdmin |
| PUT | `/dashboard/lectures/:id/status` | Update status (complete/cancel) | isAdminOrTeacher |
| DELETE | `/dashboard/lectures/:id` | Soft delete | isAdmin |
| POST | `/dashboard/lectures/bulk` | Create recurring lectures (weekly pattern) | isAdmin |
| GET | `/dashboard/lectures/schedule` | Weekly/monthly schedule view | isAdminOrTeacher |

**App (Teacher & Student):**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/app/lectures/my-schedule` | Teacher's assigned lectures | isAppUser (TEACHER) |
| GET | `/app/lectures/upcoming` | Student's batch lectures | isAppUser (STUDENT) |
| GET | `/app/lectures/:id` | Lecture detail | isAppUser |
| PUT | `/app/lectures/:id/notes` | Teacher adds post-lecture notes | isAppUser (TEACHER) |
| PUT | `/app/lectures/:id/complete` | Teacher marks as completed | isAppUser (TEACHER) |

### 1.5 Request/Response Examples

**Create Lecture:**
```json
// POST /dashboard/lectures
{
  "title": "Algebra - Quadratic Equations",
  "subject": "Mathematics",
  "description": "Solving quadratic equations using formula method",
  "batchId": 3,
  "teacherId": null,           // null = auto-assign
  "autoAssign": true,
  "date": "2025-06-15",
  "startTime": "10:00",
  "endTime": "11:30"
}

// Response
{
  "success": true,
  "message": "Lecture created and auto-assigned to John Doe",
  "data": {
    "id": 1,
    "title": "Algebra - Quadratic Equations",
    "subject": "Mathematics",
    "batchId": 3,
    "batch": { "id": 3, "name": "Batch A" },
    "teacherId": 5,
    "teacher": { "id": 5, "name": "John Doe" },
    "assignedBy": "auto",
    "date": "2025-06-15",
    "startTime": "10:00",
    "endTime": "11:30",
    "duration": 90,
    "status": "SCHEDULED"
  }
}
```

**Create Recurring Lectures:**
```json
// POST /dashboard/lectures/bulk
{
  "title": "Physics Weekly",
  "subject": "Physics",
  "batchId": 3,
  "teacherId": 5,
  "startTime": "14:00",
  "endTime": "15:30",
  "recurrence": {
    "days": ["MONDAY", "WEDNESDAY", "FRIDAY"],
    "startDate": "2025-06-01",
    "endDate": "2025-06-30"
  }
}
// Creates ~13 lecture entries for June, grouped by recurrenceId
```

---

## 2. Tests & Scores System

### 2.1 What It Does

- Admin/Teacher creates **Tests** (title, subject, batch, total marks, date)
- Admin/Teacher uploads **Scores** for each student (individual or bulk CSV)
- Students see their scores in the App with performance analytics
- Teachers see score summary per batch with stats (average, pass %, top scorers)
- Dashboard shows test analytics

### 2.2 Data Model

```prisma
model Test {
  id            Int            @id @default(autoincrement())
  title         String                        // "Mid-Term Mathematics"
  subject       String                        // "Mathematics"
  description   String?
  batchId       Int
  batch         Batch          @relation(fields: [batchId], references: [id])

  // Scoring
  totalMarks    Float                         // 100
  passingMarks  Float?                        // 35 (optional)

  // Schedule
  date          DateTime                      // Test date

  // Status
  status        TestStatus     @default(DRAFT)

  // Relations
  scores        TestScore[]

  // Audit
  createdBy     Int
  isDeleted     Boolean        @default(false)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([batchId])
  @@index([batchId, date])
  @@map("tests")
}

model TestScore {
  id            Int            @id @default(autoincrement())
  testId        Int
  test          Test           @relation(fields: [testId], references: [id], onDelete: Cascade)
  studentId     Int
  student       Student        @relation(fields: [studentId], references: [id])

  // Score
  marksObtained Float                         // 78.5
  percentage    Float                         // Auto-calculated: (marksObtained / totalMarks) * 100
  grade         String?                       // "A+", "B", etc. (auto-calculated or manual)
  status        ScoreStatus    @default(PASS) // Auto-set based on passingMarks

  // Feedback
  remarks       String?                       // "Excellent work" / "Needs improvement"

  // Who uploaded
  uploadedBy    Int                           // Admin or Teacher userId

  // Audit
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([testId, studentId])              // One score per student per test
  @@index([testId])
  @@index([studentId])
  @@index([studentId, testId])
  @@map("test_scores")
}

enum TestStatus {
  DRAFT         // Created but not visible to students
  SCHEDULED     // Upcoming test
  ONGOING       // Test day
  COMPLETED     // Test done, scores being uploaded
  PUBLISHED     // Scores visible to students
}

enum ScoreStatus {
  PASS
  FAIL
  ABSENT        // Student didn't appear
}
```

### 2.3 Grade Calculation Logic

Auto-calculated when scores are uploaded:

```
percentage = (marksObtained / totalMarks) * 100

Grade Mapping (configurable per tenant in multi-tenant):
  90-100  → A+
  80-89   → A
  70-79   → B+
  60-69   → B
  50-59   → C
  40-49   → D
  Below 40 → F

status = marksObtained >= passingMarks ? PASS : FAIL
         (if passingMarks is null, always PASS unless ABSENT)
```

### 2.4 API Endpoints

**Dashboard (Admin/Teacher):**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/dashboard/tests` | Create test | isAdminOrTeacher |
| GET | `/dashboard/tests` | List tests (filter by batch, subject, status) | isAdminOrTeacher |
| GET | `/dashboard/tests/:id` | Get test with all scores | isAdminOrTeacher |
| PUT | `/dashboard/tests/:id` | Update test details | isAdminOrTeacher |
| DELETE | `/dashboard/tests/:id` | Soft delete | isAdmin |
| PUT | `/dashboard/tests/:id/publish` | Change status to PUBLISHED (scores visible) | isAdminOrTeacher |
| POST | `/dashboard/tests/:id/scores` | Upload single student score | isAdminOrTeacher |
| POST | `/dashboard/tests/:id/scores/bulk` | Upload scores via CSV | isAdminOrTeacher |
| PUT | `/dashboard/tests/:id/scores/:scoreId` | Update a score | isAdminOrTeacher |
| GET | `/dashboard/tests/:id/stats` | Test statistics (avg, pass%, distribution) | isAdminOrTeacher |

**App (Student & Teacher):**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/app/tests` | Student's published test scores | isAppUser (STUDENT) |
| GET | `/app/tests/:id` | Student's score detail for a test | isAppUser (STUDENT) |
| GET | `/app/tests/performance` | Student's overall performance analytics | isAppUser (STUDENT) |
| GET | `/app/tests/batch/:batchId` | Teacher views batch scores | isAppUser (TEACHER) |
| GET | `/app/tests/:id/scores` | Teacher views all scores for a test | isAppUser (TEACHER) |

### 2.5 Request/Response Examples

**Create Test:**
```json
// POST /dashboard/tests
{
  "title": "Mid-Term Mathematics",
  "subject": "Mathematics",
  "batchId": 3,
  "totalMarks": 100,
  "passingMarks": 35,
  "date": "2025-06-20"
}
```

**Upload Single Score:**
```json
// POST /dashboard/tests/1/scores
{
  "studentId": 12,
  "marksObtained": 78.5,
  "remarks": "Good performance"
}

// Response (auto-calculated fields)
{
  "success": true,
  "data": {
    "id": 1,
    "testId": 1,
    "studentId": 12,
    "student": { "id": 12, "fullname": "Jane Doe" },
    "marksObtained": 78.5,
    "percentage": 78.5,
    "grade": "B+",
    "status": "PASS",
    "remarks": "Good performance"
  }
}
```

**Bulk Score Upload (CSV format):**
```csv
studentId,marksObtained,remarks
12,78.5,Good work
13,92.0,Excellent
14,0,ABSENT
15,45.0,Needs improvement
```

```json
// POST /dashboard/tests/1/scores/bulk (FormData with CSV file)
// Response
{
  "success": true,
  "data": {
    "total": 4,
    "uploaded": 3,
    "absent": 1,
    "failed": 0,
    "errors": []
  }
}
```

**Student Performance (App):**
```json
// GET /app/tests/performance
{
  "success": true,
  "data": {
    "overallAverage": 72.3,
    "totalTests": 8,
    "passed": 7,
    "failed": 1,
    "highestScore": { "test": "Physics Final", "percentage": 95 },
    "lowestScore": { "test": "Chemistry Mid-Term", "percentage": 42 },
    "subjectWise": [
      { "subject": "Mathematics", "average": 78.5, "tests": 3 },
      { "subject": "Physics", "average": 82.0, "tests": 3 },
      { "subject": "Chemistry", "average": 56.5, "tests": 2 }
    ],
    "trend": [
      { "test": "Math Unit 1", "date": "2025-03-15", "percentage": 65 },
      { "test": "Math Unit 2", "date": "2025-04-10", "percentage": 72 },
      { "test": "Math Mid-Term", "date": "2025-05-20", "percentage": 78.5 }
    ]
  }
}
```

**Test Statistics (Dashboard):**
```json
// GET /dashboard/tests/1/stats
{
  "success": true,
  "data": {
    "testId": 1,
    "title": "Mid-Term Mathematics",
    "totalStudents": 30,
    "appeared": 28,
    "absent": 2,
    "passed": 24,
    "failed": 4,
    "passPercentage": 85.7,
    "average": 68.3,
    "median": 72.0,
    "highest": 98.0,
    "lowest": 18.0,
    "gradeDistribution": {
      "A+": 3, "A": 5, "B+": 6, "B": 4, "C": 4, "D": 2, "F": 4
    },
    "topScorers": [
      { "studentId": 13, "fullname": "Alice Smith", "marks": 98, "percentage": 98 },
      { "studentId": 7, "fullname": "Bob Jones", "marks": 95, "percentage": 95 },
      { "studentId": 22, "fullname": "Carol White", "marks": 92, "percentage": 92 }
    ]
  }
}
```

---

## 3. Chat System (WebSocket)

### 3.1 What It Does

- Students can chat with teachers assigned to their batch
- Teachers can chat with students in their assigned batches
- Real-time messaging via WebSocket (Socket.IO)
- Message history persisted in database
- Online/offline presence indicators
- Typing indicators
- Read receipts
- Scalable across multiple server instances via Redis pub/sub

### 3.2 Data Model

```prisma
model Conversation {
  id            Int            @id @default(autoincrement())

  // Participants (always 1:1 for now — student ↔ teacher)
  studentId     Int
  student       Student        @relation(fields: [studentId], references: [id])
  teacherId     Int
  teacher       User           @relation("TeacherConversations", fields: [teacherId], references: [id])

  // Metadata
  lastMessageAt DateTime?
  lastMessage   String?                       // Preview: "Can you explain chapter 5?"

  // Relations
  messages      Message[]

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([studentId, teacherId])            // One conversation per student-teacher pair
  @@index([studentId])
  @@index([teacherId])
  @@index([lastMessageAt])
  @@map("conversations")
}

model Message {
  id              Int            @id @default(autoincrement())
  conversationId  Int
  conversation    Conversation   @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  // Sender
  senderId        Int                         // User.id (student's userId or teacher's userId)
  senderRole      UserRoles                   // STUDENT or TEACHER

  // Content
  content         String                      // Message text
  messageType     MessageType    @default(TEXT)

  // Attachments (optional — images, files)
  attachments     Json?                       // [{ url, filename, mimetype, size }]

  // Status
  isRead          Boolean        @default(false)
  readAt          DateTime?
  isDeleted       Boolean        @default(false)

  createdAt       DateTime       @default(now())

  @@index([conversationId])
  @@index([conversationId, createdAt])
  @@index([senderId])
  @@map("messages")
}

enum MessageType {
  TEXT
  IMAGE
  FILE
}
```

### 3.3 WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                            │
│                                                             │
│  Student App ──┐                    ┌── Teacher App         │
│                │   Socket.IO        │                       │
│                └──── Client ────────┘                       │
└────────────────────────┬────────────────────────────────────┘
                         │ wss://api.cipherlearn.com/chat
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     SERVER SIDE                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express Server + Socket.IO                         │   │
│  │                                                     │   │
│  │  Namespace: /chat                                   │   │
│  │                                                     │   │
│  │  Events (Client → Server):                          │   │
│  │    • join          → join user's rooms               │   │
│  │    • send_message  → persist + broadcast             │   │
│  │    • typing        → broadcast to recipient          │   │
│  │    • mark_read     → update DB + notify sender       │   │
│  │    • disconnect    → update presence                  │   │
│  │                                                     │   │
│  │  Events (Server → Client):                          │   │
│  │    • new_message   → delivered to recipient           │   │
│  │    • message_read  → read receipt to sender           │   │
│  │    • user_typing   → typing indicator                 │   │
│  │    • user_online   → presence update                  │   │
│  │    • user_offline  → presence update                  │   │
│  │    • error         → error notification               │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │  Redis (Pub/Sub + Adapter)                          │   │
│  │                                                     │   │
│  │  Purpose:                                           │   │
│  │  • Socket.IO adapter for multi-instance scaling     │   │
│  │  • Broadcast events across all server instances     │   │
│  │  • User presence tracking (online/offline)          │   │
│  │  • Typing indicator distribution                    │   │
│  │                                                     │   │
│  │  Keys:                                              │   │
│  │    presence:{userId} → { online: true, lastSeen }   │   │
│  │    typing:{conversationId} → { userId, timestamp }  │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │  PostgreSQL (Neon)                                  │   │
│  │                                                     │   │
│  │  • Message persistence (conversations, messages)    │   │
│  │  • Message history queries (paginated)              │   │
│  │  • Unread count queries                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Socket.IO Event Flow

**Connection & Authentication:**
```
Client connects → sends JWT in auth handshake
Server verifies JWT → extracts userId, role
Server joins user to their room: `user:{userId}`
Server updates presence in Redis: online
Server broadcasts `user_online` to relevant conversations
```

**Sending a Message:**
```
Client emits: send_message { conversationId, content, messageType }
                              │
Server receives               │
  ├── Validate sender belongs to conversation
  ├── Persist message to PostgreSQL
  ├── Update conversation.lastMessage + lastMessageAt
  ├── Emit `new_message` to recipient's room (via Redis adapter)
  └── Return acknowledgment to sender
```

**Typing Indicator:**
```
Client emits: typing { conversationId }
  │
Server receives
  ├── Set Redis key: typing:{conversationId}:{userId} (TTL 3s)
  └── Emit `user_typing` to other participant's room
```

**Read Receipts:**
```
Client emits: mark_read { conversationId, messageIds }
  │
Server receives
  ├── Update messages: isRead=true, readAt=now()
  └── Emit `message_read` to sender's room
```

**Disconnect:**
```
Client disconnects (close tab, network loss)
  │
Server detects
  ├── Update Redis presence: offline, lastSeen=now()
  └── Broadcast `user_offline` to relevant conversations
```

### 3.5 API Endpoints (REST — for history, not real-time)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/app/chat/conversations` | List user's conversations with last message + unread count | isAppUser |
| GET | `/app/chat/conversations/:id/messages` | Paginated message history (newest first) | isAppUser |
| POST | `/app/chat/conversations` | Start new conversation with a teacher/student | isAppUser |
| GET | `/app/chat/unread-count` | Total unread message count | isAppUser |
| DELETE | `/app/chat/messages/:id` | Soft-delete a message (own messages only) | isAppUser |

### 3.6 Who Can Chat With Whom

```
Rules:
1. Student can ONLY chat with teachers who teach their batch
2. Teacher can ONLY chat with students in their assigned batches
3. Admin can view all conversations (read-only, for moderation)
4. No student-to-student chat (prevents misuse)
5. No group chats (1:1 only, keeps scope manageable)
```

**Validation when starting a conversation:**
```typescript
// Student starting chat with teacher
const studentBatches = await getStudentBatches(studentId);
const teacherBatches = await getTeacherBatches(teacherId);
const commonBatches = intersection(studentBatches, teacherBatches);
if (commonBatches.length === 0) {
  throw new Error("You can only chat with teachers assigned to your batch");
}
```

### 3.7 Request/Response Examples

**Conversation List:**
```json
// GET /app/chat/conversations
{
  "success": true,
  "data": [
    {
      "id": 1,
      "participant": {
        "id": 5,
        "name": "John Doe",
        "role": "TEACHER",
        "isOnline": true
      },
      "lastMessage": "Can you explain chapter 5?",
      "lastMessageAt": "2025-06-15T10:30:00Z",
      "unreadCount": 2
    },
    {
      "id": 2,
      "participant": {
        "id": 8,
        "name": "Jane Smith",
        "role": "TEACHER",
        "isOnline": false,
        "lastSeen": "2025-06-15T09:00:00Z"
      },
      "lastMessage": "Your assignment has been reviewed",
      "lastMessageAt": "2025-06-14T16:45:00Z",
      "unreadCount": 0
    }
  ]
}
```

**Message History:**
```json
// GET /app/chat/conversations/1/messages?page=1&limit=50
{
  "success": true,
  "data": [
    {
      "id": 45,
      "senderId": 12,
      "senderRole": "STUDENT",
      "content": "Can you explain chapter 5?",
      "messageType": "TEXT",
      "isRead": false,
      "createdAt": "2025-06-15T10:30:00Z"
    },
    {
      "id": 44,
      "senderId": 5,
      "senderRole": "TEACHER",
      "content": "Sure, which part are you stuck on?",
      "messageType": "TEXT",
      "isRead": true,
      "readAt": "2025-06-15T10:28:00Z",
      "createdAt": "2025-06-15T10:25:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 44, "totalPages": 1 }
}
```

---

## 4. Database Schema (All New Models)

### 4.1 Complete Prisma Additions

```prisma
// ─── LECTURES ─────────────────────────────────

model Lecture {
  id            Int            @id @default(autoincrement())
  title         String
  subject       String
  description   String?
  batchId       Int
  batch         Batch          @relation(fields: [batchId], references: [id])
  teacherId     Int?
  teacher       User?          @relation("TeacherLectures", fields: [teacherId], references: [id])
  assignedBy    String?
  date          DateTime
  startTime     String
  endTime       String
  duration      Int
  status        LectureStatus  @default(SCHEDULED)
  notes         String?
  recurrenceId  String?
  createdBy     Int
  isDeleted     Boolean        @default(false)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([batchId])
  @@index([teacherId])
  @@index([date])
  @@index([batchId, date])
  @@map("lectures")
}

enum LectureStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// ─── TESTS & SCORES ──────────────────────────

model Test {
  id            Int            @id @default(autoincrement())
  title         String
  subject       String
  description   String?
  batchId       Int
  batch         Batch          @relation(fields: [batchId], references: [id])
  totalMarks    Float
  passingMarks  Float?
  date          DateTime
  status        TestStatus     @default(DRAFT)
  scores        TestScore[]
  createdBy     Int
  isDeleted     Boolean        @default(false)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([batchId])
  @@index([batchId, date])
  @@map("tests")
}

model TestScore {
  id              Int            @id @default(autoincrement())
  testId          Int
  test            Test           @relation(fields: [testId], references: [id], onDelete: Cascade)
  studentId       Int
  student         Student        @relation(fields: [studentId], references: [id])
  marksObtained   Float
  percentage      Float
  grade           String?
  status          ScoreStatus    @default(PASS)
  remarks         String?
  uploadedBy      Int
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@unique([testId, studentId])
  @@index([testId])
  @@index([studentId])
  @@map("test_scores")
}

enum TestStatus {
  DRAFT
  SCHEDULED
  ONGOING
  COMPLETED
  PUBLISHED
}

enum ScoreStatus {
  PASS
  FAIL
  ABSENT
}

// ─── CHAT ─────────────────────────────────────

model Conversation {
  id            Int            @id @default(autoincrement())
  studentId     Int
  student       Student        @relation(fields: [studentId], references: [id])
  teacherId     Int
  teacher       User           @relation("TeacherConversations", fields: [teacherId], references: [id])
  lastMessageAt DateTime?
  lastMessage   String?
  messages      Message[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([studentId, teacherId])
  @@index([studentId])
  @@index([teacherId])
  @@index([lastMessageAt])
  @@map("conversations")
}

model Message {
  id              Int            @id @default(autoincrement())
  conversationId  Int
  conversation    Conversation   @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId        Int
  senderRole      UserRoles
  content         String
  messageType     MessageType    @default(TEXT)
  attachments     Json?
  isRead          Boolean        @default(false)
  readAt          DateTime?
  isDeleted       Boolean        @default(false)
  createdAt       DateTime       @default(now())

  @@index([conversationId])
  @@index([conversationId, createdAt])
  @@index([senderId])
  @@map("messages")
}

enum MessageType {
  TEXT
  IMAGE
  FILE
}
```

### 4.2 Existing Model Relation Updates

Add to **Batch** model:
```prisma
lectures       Lecture[]
tests          Test[]
```

Add to **Student** model:
```prisma
testScores      TestScore[]
conversations   Conversation[]
```

Add to **User** model:
```prisma
lectures        Lecture[]       @relation("TeacherLectures")
conversations   Conversation[]  @relation("TeacherConversations")
```

---

## 5. Backend Implementation

### 5.1 New Module Structure

```
backend/src/modules/
├── dashboard/
│   ├── lectures/
│   │   ├── controller.ts
│   │   ├── service.ts         # CRUD + auto-assign logic
│   │   ├── route.ts
│   │   ├── types.ts
│   │   └── validation.ts
│   └── tests/
│       ├── controller.ts
│       ├── service.ts         # CRUD + score upload + CSV bulk + stats
│       ├── route.ts
│       ├── types.ts
│       └── validation.ts
├── app/
│   ├── lectures/
│   │   ├── controller.ts      # Teacher schedule + Student upcoming
│   │   ├── service.ts
│   │   ├── route.ts
│   │   └── types.ts
│   ├── tests/
│   │   ├── controller.ts      # Student scores + Teacher batch view
│   │   ├── service.ts
│   │   ├── route.ts
│   │   └── types.ts
│   └── chat/
│       ├── controller.ts      # REST: history, conversations list
│       ├── service.ts         # Message persistence, conversation CRUD
│       ├── route.ts
│       └── types.ts
└── chat/
    ├── socket.ts              # Socket.IO setup + event handlers
    ├── handlers/
    │   ├── connection.ts      # Auth handshake, join rooms
    │   ├── message.ts         # send_message, mark_read
    │   ├── presence.ts        # online/offline tracking
    │   └── typing.ts          # Typing indicators
    └── redis.ts               # Redis adapter setup
```

### 5.2 Socket.IO Integration with Express

In `backend/src/server.ts`:

```typescript
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupChatSocket } from "./modules/chat/socket";

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: config.APP.CLIENT_URL, credentials: true },
  path: "/socket.io",
});

setupChatSocket(io);

// Change app.listen to httpServer.listen
httpServer.listen(config.APP.PORT);
```

### 5.3 Route Registration

In `backend/src/modules/dashboard/routes.ts`, add:
```typescript
import lecturesRoutes from "./lectures/route";
import testsRoutes from "./tests/route";

router.use("/lectures", lecturesRoutes);
router.use("/tests", testsRoutes);
```

In `backend/src/modules/app/route.ts`, add:
```typescript
import appLecturesRoutes from "./lectures/route";
import appTestsRoutes from "./tests/route";
import appChatRoutes from "./chat/route";

router.use("/lectures", appLecturesRoutes);
router.use("/tests", appTestsRoutes);
router.use("/chat", appChatRoutes);
```

---

## 6. Frontend Implementation

### 6.1 New Pages & Components

**Lectures (Dashboard):**
```
frontend/src/
├── app/(pages)/lectures/page.tsx          # Lectures list + schedule view
├── components/lectures/
│   ├── LectureTable.tsx                   # Table of all lectures
│   ├── AddLectureDialog.tsx               # Create lecture form (with auto-assign toggle)
│   ├── LectureScheduleView.tsx            # Weekly calendar view
│   └── AssignTeacherDialog.tsx            # Reassign teacher modal
├── redux/slices/lectures/
│   └── lecturesApi.ts                     # RTK Query endpoints
```

**Tests & Scores (Dashboard):**
```
frontend/src/
├── app/(pages)/tests/page.tsx             # Tests list
├── app/(pages)/tests/[id]/page.tsx        # Test detail + scores table
├── components/tests/
│   ├── TestTable.tsx                      # All tests table
│   ├── AddTestDialog.tsx                  # Create test form
│   ├── ScoreUploadDialog.tsx              # Upload single score
│   ├── BulkScoreUploadDialog.tsx          # CSV upload for scores
│   ├── TestStatsCard.tsx                  # Average, pass%, grade distribution chart
│   └── ScoreTable.tsx                     # Scores table with sorting
├── redux/slices/tests/
│   └── testsApi.ts                        # RTK Query endpoints
```

### 6.2 Sidebar Updates

```typescript
// "Manage" group — add Lectures
{ href: "/lectures", label: "Lectures", icon: Calendar }

// "Learn" group — add Tests
{ href: "/tests", label: "Tests", icon: ClipboardCheck }
```

### 6.3 RTK Query Tags

Add to `tagTypes` in `api.ts`:
```typescript
tagTypes: [...existing, 'Lectures', 'Tests', 'TestScores', 'Conversations', 'Messages']
```

---

## 7. App (Mobile) Implementation

### 7.1 Teacher App Screens

```
Teacher App
├── My Schedule (Lectures)
│   ├── Today's lectures (highlighted)
│   ├── This week view
│   ├── Mark lecture as completed
│   └── Add post-lecture notes
├── Tests & Scores
│   ├── View tests by batch
│   ├── View scores per test
│   └── Upload scores (if permission)
└── Chat
    ├── Conversation list (students)
    ├── Chat screen (messages + send)
    ├── Online/offline indicators
    └── Typing indicator
```

### 7.2 Student App Screens

```
Student App
├── Lecture Schedule
│   ├── Upcoming lectures for my batch
│   └── Past lectures with teacher notes
├── My Scores
│   ├── All test results (published only)
│   ├── Performance chart (trend over time)
│   ├── Subject-wise breakdown
│   └── Individual test detail
└── Chat
    ├── Teacher list (available to chat)
    ├── Conversation list
    ├── Chat screen
    └── Typing + read receipts
```

---

## 8. Scaling Strategy

### 8.1 WebSocket Scaling

**Problem:** Socket.IO stores connections in memory. If you run 2+ server instances behind a load balancer, a message sent to Instance A won't reach a user connected to Instance B.

**Solution: Redis Adapter**

```
                    Load Balancer
                   ┌──────┴──────┐
                   │             │
            Instance A      Instance B
            Socket.IO       Socket.IO
                   │             │
                   └──────┬──────┘
                          │
                     Redis Pub/Sub
                          │
                   ┌──────┴──────┐
                   │             │
              Subscribe      Subscribe
            Instance A      Instance B
```

When Instance A emits a message, Redis broadcasts it to all instances. Instance B receives it and delivers to the connected client.

```typescript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### 8.2 Database Scaling

**Messages table grows fastest.** Mitigation:

1. **Pagination:** Never load all messages. Always paginate (50 per page, newest first)
2. **Indexes:** Composite index on `(conversationId, createdAt)` for fast history queries
3. **Archival:** Messages older than 6 months → move to archive table (cron job)
4. **Connection pooling:** Neon serverless handles this automatically

### 8.3 Redis Requirements

| Usage | Key Pattern | TTL |
|-------|------------|-----|
| Socket.IO adapter | Internal (managed by adapter) | — |
| User presence | `presence:{userId}` | 5 minutes (refreshed on heartbeat) |
| Typing indicator | `typing:{conversationId}:{userId}` | 3 seconds |
| Rate limiting (chat) | `chat_rate:{userId}` | 1 minute |

### 8.4 Chat Rate Limiting

Prevent spam:
```
- Max 60 messages per minute per user
- Max 5 messages per second per user (burst)
- Max message length: 2000 characters
- Max attachment size: 5MB
- Max attachments per message: 3
```

### 8.5 Hosting Addition for Chat

| Service | Purpose | Cost |
|---------|---------|------|
| **Upstash Redis** | Socket.IO adapter + presence + rate limiting | Free tier: 10k commands/day. Pro: $10/mo |
| **Railway** (same instance) | Socket.IO runs on same Express server | No extra cost |

Total additional cost for chat: **$0-10/month**

---

## 9. Dependencies to Install

### 9.1 Backend

```bash
# WebSocket
npm install socket.io @socket.io/redis-adapter

# Redis client
npm install redis

# These are already installed (no action needed):
# express, prisma, jsonwebtoken, multer, cloudinary, joi, winston
```

### 9.2 Frontend

```bash
# WebSocket client
npm install socket.io-client

# These are already installed (no action needed):
# @reduxjs/toolkit, recharts (for score charts)
```

---

## 10. Implementation Phases

### Phase 1: Lectures (Week 1)
- [ ] Add Lecture model + LectureStatus enum to Prisma schema
- [ ] Add relations to Batch and User models
- [ ] Run migration
- [ ] Create dashboard lectures module (service, controller, route, validation, types)
- [ ] Implement auto-assign algorithm in service
- [ ] Create app lectures module (teacher schedule + student upcoming)
- [ ] Create frontend: lecturesApi, LectureTable, AddLectureDialog, lectures page
- [ ] Add Lectures to sidebar
- [ ] Run builds, verify no errors

### Phase 2: Tests & Scores (Week 2)
- [ ] Add Test, TestScore models + enums to Prisma schema
- [ ] Add relations to Batch and Student models
- [ ] Run migration
- [ ] Create dashboard tests module (CRUD + score upload + bulk CSV + stats)
- [ ] Implement grade calculation and auto-status logic
- [ ] Create app tests module (student scores + teacher batch view + performance)
- [ ] Create frontend: testsApi, TestTable, AddTestDialog, ScoreUploadDialog, BulkScoreUploadDialog
- [ ] Create test detail page with score table + stats
- [ ] Add Tests to sidebar
- [ ] Run builds, verify no errors

### Phase 3: Chat — Backend (Week 3)
- [ ] Add Conversation, Message models + MessageType enum to Prisma schema
- [ ] Run migration
- [ ] Install socket.io, @socket.io/redis-adapter, redis
- [ ] Set up Redis connection (Upstash)
- [ ] Integrate Socket.IO with Express server (httpServer)
- [ ] Implement Socket.IO event handlers (connection, message, typing, presence, read)
- [ ] Create REST chat module for history (conversations list, message history)
- [ ] Implement chat authorization (batch-based student-teacher pairing)
- [ ] Add chat rate limiting
- [ ] Test with multiple connections

### Phase 4: Chat — Frontend (Week 4)
- [ ] Install socket.io-client
- [ ] Create Socket.IO connection hook/provider
- [ ] Create chat Redux slice (conversations, messages, unread count)
- [ ] Create frontend components: ConversationList, ChatWindow, MessageBubble, TypingIndicator
- [ ] Add real-time message handling (new message, read receipts, typing)
- [ ] Add online/offline presence indicators
- [ ] Add unread badge to sidebar chat link
- [ ] Run builds, verify no errors

### Phase 5: Integration & Polish (Week 5)
- [ ] Connect lectures to teacher-batch assignments for auto-assign
- [ ] Add lecture/test analytics to dashboard KPIs
- [ ] Add score trend chart to student app performance page
- [ ] Test chat across multiple browser tabs (multi-instance simulation)
- [ ] Load test chat with concurrent connections
- [ ] End-to-end test all three features
- [ ] Production deployment with Redis
