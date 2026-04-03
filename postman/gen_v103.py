import json

with open('v.1.0.2.json', encoding='utf-8') as f:
    data = json.load(f)

AUTH = [{"key": "Authorization", "value": "Bearer {{authToken}}"}]
AUTH_JSON = AUTH + [{"key": "Content-Type", "value": "application/json"}]
BASE = "{{baseUrl}}"

def url(raw, path):
    return {"raw": raw, "host": [BASE], "path": path}

def get(name, raw, path, query=None, desc="", auth=AUTH):
    r = {"method": "GET", "header": auth, "url": url(raw, path), "description": desc}
    if query:
        r["url"]["query"] = query
    return {"name": name, "request": r, "response": []}

def post_json(name, raw, path, body, desc=""):
    return {"name": name, "request": {
        "method": "POST", "header": AUTH_JSON,
        "body": {"mode": "raw", "raw": body, "options": {"raw": {"language": "json"}}},
        "url": url(raw, path), "description": desc
    }, "response": []}

def post_form(name, raw, path, formdata, desc=""):
    return {"name": name, "request": {
        "method": "POST", "header": AUTH,
        "body": {"mode": "formdata", "formdata": formdata},
        "url": url(raw, path), "description": desc
    }, "response": []}

def put_json(name, raw, path, body, desc=""):
    return {"name": name, "request": {
        "method": "PUT", "header": AUTH_JSON,
        "body": {"mode": "raw", "raw": body, "options": {"raw": {"language": "json"}}},
        "url": url(raw, path), "description": desc
    }, "response": []}

def put_form(name, raw, path, formdata, desc=""):
    return {"name": name, "request": {
        "method": "PUT", "header": AUTH,
        "body": {"mode": "formdata", "formdata": formdata},
        "url": url(raw, path), "description": desc
    }, "response": []}

def delete(name, raw, path, desc=""):
    return {"name": name, "request": {
        "method": "DELETE", "header": AUTH,
        "url": url(raw, path), "description": desc
    }, "response": []}

def t(k, v, d=""):
    e = {"key": k, "value": v, "type": "text"}
    if d: e["description"] = d
    return e

def f(k, d=""):
    e = {"key": k, "value": "", "type": "file"}
    if d: e["description"] = d
    return e

def q(k, v, disabled=False, desc=""):
    e = {"key": k, "value": v}
    if disabled: e["disabled"] = True
    if desc: e["description"] = desc
    return e

# ── Bump version ───────────────────────────────────────────────────────────────
data['info']['_postman_id'] = 'cipherlearn-dashboard-api-v1.0.3'
data['info']['name'] = 'CipherLearn Dashboard API v1.0.3'
data['info']['version'] = '1.0.3'
data['info']['description'] += """

**v1.0.3 Changes (full audit — all existing dashboard routes now documented):**
- Lectures module added (POST/GET/PUT/DELETE /dashboard/lectures + bulk + schedule + assign + status)
  - POST /dashboard/lectures now accepts optional files[] multipart for attachments
- Teachers module added (POST/GET/PUT/DELETE /dashboard/teachers)
- Tests module added (full CRUD + scores + CSV upload + publish)
- Announcements module added (GET/POST/PUT/DELETE /dashboard/announcements)
- Assignments module added (slots CRUD + submissions + review)
- Study Materials module added (GET/POST/PUT/DELETE /dashboard/study-materials)
- Notifications module added (GET /dashboard/notifications + mark read)
- Settings module added (GET/PUT /dashboard/settings + reset permissions)
- Notes: added PUT /:id (update) — was missing
- YouTube Videos: added PUT /:id (update) — was missing
- Student App section replaced with reference note (use app.1.0.x.json for app APIs)"""

# ── Remove outdated Student App folder ────────────────────────────────────────
data['item'] = [g for g in data['item'] if g['name'] != 'Student App']

# ── Fix Notes — add PUT ────────────────────────────────────────────────────────
notes_folder = next(g for g in data['item'] if g['name'] == 'Notes')
notes_folder['description'] = "Dashboard notes management. Auth: Admin or Teacher."
notes_folder['item'].insert(2, put_json(
    'Update Note',
    BASE + '/dashboard/notes/{{noteId}}',
    ['dashboard', 'notes', '{{noteId}}'],
    json.dumps({"title": "Updated Title", "content": ["Updated content line 1"], "category": "MATH"}, indent=2),
    'Update a note by ID. Auth: Admin or Teacher.'
))

# ── Fix YouTube Videos — add PUT ──────────────────────────────────────────────
yt_folder = next(g for g in data['item'] if g['name'] == 'YouTube Videos')
yt_folder['description'] = "Dashboard YouTube video management. Auth: Admin or Teacher."
yt_folder['item'].insert(3, put_json(
    'Update YouTube Video',
    BASE + '/dashboard/youtube-videos/{{videoId}}',
    ['dashboard', 'youtube-videos', '{{videoId}}'],
    json.dumps({"title": "Updated Title", "description": "Updated desc", "category": "MATH"}, indent=2),
    'Update a YouTube video by ID. Auth: Admin or Teacher.'
))

# ── NEW: Lectures folder ───────────────────────────────────────────────────────
lectures_folder = {
    "name": "Lectures",
    "description": (
        "Lecture scheduling and management.\n\n"
        "- Admin: full CRUD + assign teacher + bulk recurring\n"
        "- Teacher: view + update status\n\n"
        "POST /dashboard/lectures accepts optional files[] (multipart) for attachments (added v1.0.3)."
    ),
    "item": [
        post_form(
            'Create Lecture',
            BASE + '/dashboard/lectures',
            ['dashboard', 'lectures'],
            [
                t('title', 'Mathematics Class', 'Required'),
                t('subject', 'Mathematics', 'Required'),
                t('batchId', '1', 'Required'),
                t('date', '2026-04-10', 'Required — YYYY-MM-DD'),
                t('startTime', '09:00', 'Required — HH:MM'),
                t('endTime', '10:00', 'Required — HH:MM'),
                t('teacherId', '2', 'Optional — assign specific teacher'),
                t('autoAssign', 'false', 'Optional — auto-assign best available teacher'),
                t('room', 'Room 3', 'Optional'),
                t('description', 'Chapter 5 revision', 'Optional'),
                f('files', 'Optional — lecture attachments (max 5, 20MB each)')
            ],
            'Admin only. Creates a single lecture. Sends push notification to batch students.\n\nAccepts multipart/form-data so file attachments can be included.\n\nAuth: ADMIN'
        ),
        post_json(
            'Create Bulk (Recurring) Lectures',
            BASE + '/dashboard/lectures/bulk',
            ['dashboard', 'lectures', 'bulk'],
            json.dumps({
                "title": "Physics Weekly",
                "subject": "Physics",
                "batchId": 1,
                "startTime": "10:00",
                "endTime": "11:00",
                "recurrence": {"days": ["MONDAY", "WEDNESDAY"], "startDate": "2026-04-07", "endDate": "2026-06-30"}
            }, indent=2),
            'Admin only. Creates recurring lectures. Returns { created, recurrenceId }.\n\nAuth: ADMIN'
        ),
        get(
            'Get All Lectures',
            BASE + '/dashboard/lectures?page=1&limit=20',
            ['dashboard', 'lectures'],
            [q('batchId', '1', True, 'Filter by batch'), q('teacherId', '1', True, 'Filter by teacher'),
             q('status', 'SCHEDULED', True, 'SCHEDULED|IN_PROGRESS|COMPLETED|CANCELLED'),
             q('startDate', '2026-04-01', True), q('endDate', '2026-04-30', True),
             q('page', '1'), q('limit', '20')],
            'Get paginated lecture list. Auth: Admin or Teacher.'
        ),
        get(
            'Get Schedule View',
            BASE + '/dashboard/lectures/schedule?startDate=2026-04-01&endDate=2026-04-30',
            ['dashboard', 'lectures', 'schedule'],
            [q('batchId', '1', True), q('teacherId', '1', True),
             q('startDate', '2026-04-01'), q('endDate', '2026-04-30')],
            'Schedule/calendar view of lectures. Auth: Admin or Teacher.'
        ),
        get('Get Lecture by ID', BASE + '/dashboard/lectures/{{lectureId}}',
            ['dashboard', 'lectures', '{{lectureId}}'],
            desc='Auth: Admin or Teacher.'),
        put_json(
            'Update Lecture',
            BASE + '/dashboard/lectures/{{lectureId}}',
            ['dashboard', 'lectures', '{{lectureId}}'],
            json.dumps({"title": "Updated Title", "room": "Lab B", "status": "COMPLETED"}, indent=2),
            'Admin only. Update lecture fields.\n\nAuth: ADMIN'
        ),
        put_json(
            'Assign Teacher',
            BASE + '/dashboard/lectures/{{lectureId}}/assign',
            ['dashboard', 'lectures', '{{lectureId}}', 'assign'],
            json.dumps({"teacherId": 3}, indent=2),
            'Admin only. Assign or reassign a teacher to a lecture.\n\nAuth: ADMIN'
        ),
        put_json(
            'Update Status',
            BASE + '/dashboard/lectures/{{lectureId}}/status',
            ['dashboard', 'lectures', '{{lectureId}}', 'status'],
            json.dumps({"status": "COMPLETED", "notes": "Covered chapters 5-6"}, indent=2),
            'Admin or Teacher. Update lecture status and optional notes.\n\nAuth: Admin or Teacher'
        ),
        delete('Delete Lecture', BASE + '/dashboard/lectures/{{lectureId}}',
               ['dashboard', 'lectures', '{{lectureId}}'],
               'Admin only. Soft-delete a lecture.\n\nAuth: ADMIN'),
    ]
}

# ── NEW: Teachers folder ───────────────────────────────────────────────────────
teachers_folder = {
    "name": "Teachers",
    "description": "Teacher management. All routes: Admin only.",
    "item": [
        post_json('Create Teacher', BASE + '/dashboard/teachers', ['dashboard', 'teachers'],
                  json.dumps({"name": "Priya Sharma", "email": "priya@example.com", "phone": "9876543210",
                              "subjects": ["Mathematics", "Physics"]}, indent=2),
                  'Admin only. Creates a teacher account (sends registration email).\n\nAuth: ADMIN'),
        get('Get All Teachers', BASE + '/dashboard/teachers?page=1&limit=20', ['dashboard', 'teachers'],
            [q('search', '', True, 'Search by name/email'), q('page', '1'), q('limit', '20')],
            'Admin only. Paginated teacher list.\n\nAuth: ADMIN'),
        get('Get Teacher by ID', BASE + '/dashboard/teachers/{{teacherId}}',
            ['dashboard', 'teachers', '{{teacherId}}'], desc='Auth: ADMIN'),
        put_json('Update Teacher', BASE + '/dashboard/teachers/{{teacherId}}',
                 ['dashboard', 'teachers', '{{teacherId}}'],
                 json.dumps({"name": "Priya Sharma", "phone": "9876543210", "subjects": ["Mathematics"]}, indent=2),
                 'Auth: ADMIN'),
        delete('Delete Teacher', BASE + '/dashboard/teachers/{{teacherId}}',
               ['dashboard', 'teachers', '{{teacherId}}'], 'Soft-delete. Auth: ADMIN'),
    ]
}

# ── NEW: Tests folder ──────────────────────────────────────────────────────────
tests_folder = {
    "name": "Tests & Exams",
    "description": "Test management from dashboard.\n\n- Admin/Teacher: full access\n- Delete: Admin only",
    "item": [
        post_json('Create Test', BASE + '/dashboard/tests', ['dashboard', 'tests'],
                  json.dumps({"title": "Unit Test 1", "subject": "Mathematics", "batchId": 1,
                              "totalMarks": 100, "passingMarks": 40, "date": "2026-04-20",
                              "time": "10:00", "duration": 90, "testType": "UNIT_TEST"}, indent=2),
                  'Auth: Admin or Teacher.'),
        get('Get All Tests', BASE + '/dashboard/tests?page=1&limit=20', ['dashboard', 'tests'],
            [q('batchId', '1', True), q('subject', '', True), q('status', '', True, 'SCHEDULED|ONGOING|COMPLETED|PUBLISHED'),
             q('page', '1'), q('limit', '20')],
            'Auth: Admin or Teacher.'),
        get('Get Test by ID', BASE + '/dashboard/tests/{{testId}}',
            ['dashboard', 'tests', '{{testId}}'], desc='Auth: Admin or Teacher.'),
        get('Get Test Stats', BASE + '/dashboard/tests/{{testId}}/stats',
            ['dashboard', 'tests', '{{testId}}', 'stats'],
            desc='Class average, highest/lowest, distribution. Auth: Admin or Teacher.'),
        get('Get Test Scores', BASE + '/dashboard/tests/{{testId}}/scores?page=1&limit=50',
            ['dashboard', 'tests', '{{testId}}', 'scores'],
            [q('page', '1'), q('limit', '50'), q('status', '', True, 'Filter by score status')],
            'Paginated student scores. Auth: Admin or Teacher.'),
        put_json('Update Test', BASE + '/dashboard/tests/{{testId}}',
                 ['dashboard', 'tests', '{{testId}}'],
                 json.dumps({"title": "Updated Title", "totalMarks": 50, "date": "2026-04-25"}, indent=2),
                 'Auth: Admin or Teacher.'),
        put_json('Publish Test Results', BASE + '/dashboard/tests/{{testId}}/publish',
                 ['dashboard', 'tests', '{{testId}}', 'publish'], '{}',
                 'Locks scores and notifies students. Auth: Admin or Teacher.'),
        post_json('Upload Single Score', BASE + '/dashboard/tests/{{testId}}/scores',
                  ['dashboard', 'tests', '{{testId}}', 'scores'],
                  json.dumps({"studentId": 5, "marksObtained": 78, "remarks": "Good attempt"}, indent=2),
                  'Upload or update one student score. Auth: Admin or Teacher.'),
        post_form('Upload Scores via CSV', BASE + '/dashboard/tests/{{testId}}/scores/bulk',
                  ['dashboard', 'tests', '{{testId}}', 'scores', 'bulk'],
                  [f('file', 'CSV: columns studentId, marksObtained, remarks')],
                  'Bulk upload scores from CSV file. Auth: Admin or Teacher.'),
        put_json('Update Score', BASE + '/dashboard/tests/{{testId}}/scores/{{scoreId}}',
                 ['dashboard', 'tests', '{{testId}}', 'scores', '{{scoreId}}'],
                 json.dumps({"marksObtained": 85, "remarks": "Revised"}, indent=2),
                 'Auth: Admin or Teacher.'),
        delete('Delete Test', BASE + '/dashboard/tests/{{testId}}',
               ['dashboard', 'tests', '{{testId}}'], 'Auth: ADMIN only.'),
    ]
}

# ── NEW: Announcements folder ──────────────────────────────────────────────────
ann_folder = {
    "name": "Announcements",
    "description": "Dashboard announcement management.\n\n- Create/Update/Delete: Admin or Teacher\n- Delete: Admin only",
    "item": [
        get('Get All Announcements', BASE + '/dashboard/announcements?page=1&limit=20',
            ['dashboard', 'announcements'],
            [q('page', '1'), q('limit', '20'), q('category', '', True, 'EXAM|HOLIDAY|LECTURE|GENERAL|EVENT'),
             q('search', '', True)],
            'Auth: Admin or Teacher.'),
        get('Get Active Announcements', BASE + '/dashboard/announcements/active',
            ['dashboard', 'announcements', 'active'], desc='Active announcements visible to students. Auth: any authenticated.'),
        get('Get Announcement by ID', BASE + '/dashboard/announcements/{{announcementId}}',
            ['dashboard', 'announcements', '{{announcementId}}'], desc='Auth: Admin or Teacher.'),
        post_form('Create Announcement', BASE + '/dashboard/announcements',
                  ['dashboard', 'announcements'],
                  [t('title', 'Exam Notice', 'Required'), t('description', 'Unit test next Monday', 'Required'),
                   t('category', 'EXAM', 'EXAM|HOLIDAY|LECTURE|GENERAL|EVENT'),
                   t('department', '', 'Optional'), t('pinned', 'false', 'Optional'),
                   f('image', 'Optional announcement image')],
                  'Auth: Admin or Teacher.'),
        put_form('Update Announcement', BASE + '/dashboard/announcements/{{announcementId}}',
                 ['dashboard', 'announcements', '{{announcementId}}'],
                 [t('title', 'Updated Title', 'Optional'), t('description', 'Updated desc', 'Optional'),
                  t('category', 'GENERAL', 'Optional'), f('image', 'Optional replacement image')],
                 'Auth: Admin or Teacher.'),
        delete('Delete Announcement', BASE + '/dashboard/announcements/{{announcementId}}',
               ['dashboard', 'announcements', '{{announcementId}}'], 'Auth: ADMIN only.'),
    ]
}

# ── NEW: Assignments folder ────────────────────────────────────────────────────
assign_folder = {
    "name": "Assignments",
    "description": "Assignment management.\n\n- Slots (create/manage): Admin or Teacher\n- Submissions: all authenticated users",
    "item": [
        post_form('Create Assignment Slot', BASE + '/dashboard/assignments/slots',
                  ['dashboard', 'assignments', 'slots'],
                  [t('title', 'Chapter 3 Assignment', 'Required'), t('subject', 'Mathematics', 'Required'),
                   t('batchIds', '[1,2]', 'Required — JSON array of batch IDs'),
                   t('description', 'Solve exercises 1-20', 'Optional'),
                   t('dueDate', '2026-04-15T23:59:00', 'Optional'), t('submissionType', 'FILE', 'FILE|LINK|TEXT'),
                   t('assignmentStatus', 'PUBLISHED', 'DRAFT|PUBLISHED'),
                   f('attachments', 'Optional brief attachments (max 5, 50MB each)')],
                  'Auth: Admin or Teacher.'),
        get('Get All Assignment Slots', BASE + '/dashboard/assignments/slots?page=1&limit=20',
            ['dashboard', 'assignments', 'slots'],
            [q('batchId', '1', True), q('status', '', True, 'DRAFT|PUBLISHED'),
             q('subject', '', True), q('page', '1'), q('limit', '20')],
            'Auth: any authenticated.'),
        get('Get Assignment Slot by ID', BASE + '/dashboard/assignments/slots/{{slotId}}',
            ['dashboard', 'assignments', 'slots', '{{slotId}}'], desc='Auth: any authenticated.'),
        get('Get Slot Stats', BASE + '/dashboard/assignments/slots/{{slotId}}/stats',
            ['dashboard', 'assignments', 'slots', '{{slotId}}', 'stats'],
            desc='Submission counts (submitted/not submitted/late). Auth: Admin or Teacher.'),
        put_form('Update Assignment Slot', BASE + '/dashboard/assignments/slots/{{slotId}}',
                 ['dashboard', 'assignments', 'slots', '{{slotId}}'],
                 [t('title', 'Updated Title', 'Optional'), t('dueDate', '2026-04-20T23:59:00', 'Optional'),
                  t('assignmentStatus', 'PUBLISHED', 'Optional'),
                  f('attachments', 'Optional new attachments')],
                 'Auth: Admin or Teacher.'),
        delete('Delete Assignment Slot', BASE + '/dashboard/assignments/slots/{{slotId}}',
               ['dashboard', 'assignments', 'slots', '{{slotId}}'], 'Soft-delete. Auth: Admin or Teacher.'),
        post_form('Submit Assignment (Student)', BASE + '/dashboard/assignments/submissions',
                  ['dashboard', 'assignments', 'submissions'],
                  [t('slotId', '1', 'Required'), t('note', 'My solution is attached', 'Optional'),
                   f('files', 'Submission files (max 10, 25MB each)')],
                  'Student submits files for an assignment slot.\n\nAuth: any authenticated.'),
        get('Get All Submissions', BASE + '/dashboard/assignments/submissions?page=1&limit=20',
            ['dashboard', 'assignments', 'submissions'],
            [q('slotId', '1', True), q('status', '', True, 'PENDING|ACCEPTED|REJECTED'),
             q('page', '1'), q('limit', '20')],
            'Auth: Admin or Teacher.'),
        get('Get Submission by ID', BASE + '/dashboard/assignments/submissions/{{submissionId}}',
            ['dashboard', 'assignments', 'submissions', '{{submissionId}}'],
            desc='Auth: any authenticated.'),
        get('Get My Submission for Slot', BASE + '/dashboard/assignments/slots/{{slotId}}/my-submission',
            ['dashboard', 'assignments', 'slots', '{{slotId}}', 'my-submission'],
            desc='Student views their own submission. Auth: any authenticated.'),
        put_json('Review Submission', BASE + '/dashboard/assignments/submissions/{{submissionId}}/review',
                 ['dashboard', 'assignments', 'submissions', '{{submissionId}}', 'review'],
                 json.dumps({"status": "ACCEPTED", "feedback": "Good work!"}, indent=2),
                 'Auth: Admin or Teacher.'),
        get('Get Student Assignment Stats', BASE + '/dashboard/assignments/students/{{studentId}}/stats',
            ['dashboard', 'assignments', 'students', '{{studentId}}', 'stats'],
            desc='Submitted/pending/accepted counts for a student. Auth: any authenticated.'),
    ]
}

# ── NEW: Study Materials folder ────────────────────────────────────────────────
materials_folder = {
    "name": "Study Materials",
    "description": "Study material management.\n\n- Upload/Update/Delete: Admin or Teacher\n- View: any authenticated",
    "item": [
        get('Get Categories', BASE + '/dashboard/study-materials/categories',
            ['dashboard', 'study-materials', 'categories'],
            desc='Distinct category list. Auth: any authenticated.'),
        post_form('Upload Study Material', BASE + '/dashboard/study-materials',
                  ['dashboard', 'study-materials'],
                  [t('title', 'Chapter 5 Notes', 'Required'), t('batchId', '1', 'Required'),
                   t('subject', 'Mathematics', 'Optional'), t('category', 'NOTES', 'Optional'),
                   t('description', 'Summary of quadratic equations', 'Optional'),
                   f('files', 'Files (max 10, 100MB each — PDF, images, video MP4/MOV/AVI)')],
                  'Auth: Admin or Teacher.'),
        get('Get All Study Materials', BASE + '/dashboard/study-materials?page=1&limit=20',
            ['dashboard', 'study-materials'],
            [q('batchId', '1', True), q('subject', '', True), q('category', '', True),
             q('page', '1'), q('limit', '20')],
            'Auth: any authenticated.'),
        get('Get Study Material by ID', BASE + '/dashboard/study-materials/{{materialId}}',
            ['dashboard', 'study-materials', '{{materialId}}'], desc='Auth: any authenticated.'),
        put_form('Update Study Material', BASE + '/dashboard/study-materials/{{materialId}}',
                 ['dashboard', 'study-materials', '{{materialId}}'],
                 [t('title', 'Updated Title', 'Optional'), t('subject', 'Physics', 'Optional'),
                  f('files', 'Optional new files to add')],
                 'Auth: Admin or Teacher.'),
        delete('Delete Study Material', BASE + '/dashboard/study-materials/{{materialId}}',
               ['dashboard', 'study-materials', '{{materialId}}'], 'Auth: Admin or Teacher.'),
    ]
}

# ── NEW: Notifications folder ──────────────────────────────────────────────────
notif_folder = {
    "name": "Notifications",
    "description": "In-app notification inbox for dashboard users.",
    "item": [
        get('Get Notifications', BASE + '/dashboard/notifications?page=1&limit=20',
            ['dashboard', 'notifications'],
            [q('page', '1'), q('limit', '20'), q('unreadOnly', 'false', True)],
            'Auth: any authenticated.'),
        get('Get Unread Count', BASE + '/dashboard/notifications/unread-count',
            ['dashboard', 'notifications', 'unread-count'],
            desc='Returns { unreadCount }. Auth: any authenticated.'),
        {"name": "Mark Notification Read", "request": {
            "method": "PATCH", "header": AUTH,
            "url": url(BASE + '/dashboard/notifications/{{notificationId}}/read',
                       ['dashboard', 'notifications', '{{notificationId}}', 'read']),
            "description": "Mark one notification as read. Auth: any authenticated."
        }, "response": []},
        post_json('Mark All Read', BASE + '/dashboard/notifications/mark-all-read',
                  ['dashboard', 'notifications', 'mark-all-read'], '{}',
                  'Mark all notifications as read. Auth: any authenticated.'),
    ]
}

# ── NEW: Settings folder ───────────────────────────────────────────────────────
settings_folder = {
    "name": "Settings",
    "description": "Class and teacher permission settings.",
    "item": [
        get('Get Settings', BASE + '/dashboard/settings', ['dashboard', 'settings'],
            desc='Returns class config + teacherPermissions flags. Auth: any authenticated.'),
        put_json('Update Settings', BASE + '/dashboard/settings', ['dashboard', 'settings'],
                 json.dumps({
                     "teacherPermissions": {
                         "canManageLectures": False, "canUploadNotes": True,
                         "canManageAssignments": True, "canViewFees": True,
                         "canSendAnnouncements": False
                     }
                 }, indent=2),
                 'Update teacher permission flags and class settings. Auth: ADMIN.'),
        post_json('Reset Teacher Permissions to Default',
                  BASE + '/dashboard/settings/reset-teacher-permissions',
                  ['dashboard', 'settings', 'reset-teacher-permissions'], '{}',
                  'Reset all teacher permissions to system defaults. Auth: ADMIN.'),
    ]
}

# ── App API Reference folder ───────────────────────────────────────────────────
app_ref_folder = {
    "name": "App API Reference",
    "description": (
        "The Student/Teacher mobile app APIs (/api/app/*) are documented in a separate collection:\n\n"
        "**app.1.0.16.json** — import that file for all app-side endpoints:\n"
        "- Auth, Profile, Dashboard, Lectures, Tests, Attendance\n"
        "- Assignments, Announcements, Notifications, Resources (Notes/Videos/Materials)\n"
        "- Fees, Doubts, Teacher CRUD, Admin Management"
    ),
    "item": []
}

# ── Assemble final item list ───────────────────────────────────────────────────
# Keep existing folders, inserting new ones in logical order
existing = {g['name']: g for g in data['item']}

new_item_list = [
    existing['Auth'],
    teachers_folder,
    existing['Batches'],
    existing['Students/Enrollment'],
    lectures_folder,
    tests_folder,
    existing['Attendance'],
    assign_folder,
    ann_folder,
    existing['Notes'],           # updated with PUT
    existing['YouTube Videos'],  # updated with PUT
    materials_folder,
    existing['Fees'],
    existing['Analytics'],
    notif_folder,
    settings_folder,
    existing['CRM / Leads'],
    existing['Public Landing Pages'],
    app_ref_folder,
]

data['item'] = new_item_list

# ── Write output ───────────────────────────────────────────────────────────────
with open('v.1.0.3.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Done — v.1.0.3.json written')
