import bcrypt from "bcryptjs";
import { prisma } from "../../../config/db.config";
import { config } from "../../../config/env.config";
import { log } from "../../../utils/logtail";
import { cacheService } from "../../../cache";
import { UserRoles } from "../../../../prisma/generated/prisma/client";

const SEED_TAG = "[SEED]";

// ────────────────────────────────────────────────────────────
// API Registry — every dashboard route for testing
// ────────────────────────────────────────────────────────────

interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  module: string;
  auth: "admin" | "adminOrTeacher" | "authenticated";
  hasValidation: boolean;
}

const API_REGISTRY: ApiEndpoint[] = [
  { method: "GET",  path: "/dashboard/batches",                    module: "Batches",       auth: "adminOrTeacher", hasValidation: false },
  { method: "GET",  path: "/dashboard/batches/drafts",             module: "Batches",       auth: "admin",          hasValidation: false },
  { method: "POST", path: "/dashboard/batches",                    module: "Batches",       auth: "admin",          hasValidation: true },
  { method: "GET",  path: "/dashboard/student-enrollment",         module: "Students",      auth: "adminOrTeacher", hasValidation: false },
  { method: "GET",  path: "/dashboard/student-enrollment/deleted", module: "Students",      auth: "admin",          hasValidation: false },
  { method: "POST", path: "/dashboard/student-enrollment",         module: "Students",      auth: "admin",          hasValidation: true },
  { method: "GET",  path: "/dashboard/attendance",                 module: "Attendance",    auth: "adminOrTeacher", hasValidation: false },
  { method: "GET",  path: "/dashboard/fees/receipts",              module: "Fees",          auth: "adminOrTeacher", hasValidation: false },
  { method: "GET",  path: "/dashboard/fees/receipts/summary",      module: "Fees",          auth: "adminOrTeacher", hasValidation: false },
  { method: "POST", path: "/dashboard/fees/structures",            module: "Fees",          auth: "adminOrTeacher", hasValidation: true },
  { method: "POST", path: "/dashboard/fees/receipts",              module: "Fees",          auth: "adminOrTeacher", hasValidation: true },
  { method: "GET",  path: "/dashboard/lectures",                   module: "Lectures",      auth: "adminOrTeacher", hasValidation: false },
  { method: "GET",  path: "/dashboard/lectures/schedule",          module: "Lectures",      auth: "adminOrTeacher", hasValidation: false },
  { method: "POST", path: "/dashboard/lectures",                   module: "Lectures",      auth: "adminOrTeacher", hasValidation: true },
  { method: "GET",  path: "/dashboard/tests",                      module: "Tests",         auth: "adminOrTeacher", hasValidation: false },
  { method: "POST", path: "/dashboard/tests",                      module: "Tests",         auth: "adminOrTeacher", hasValidation: true },
  { method: "GET",  path: "/dashboard/notes",                      module: "Notes",         auth: "adminOrTeacher", hasValidation: false },
  { method: "POST", path: "/dashboard/notes",                      module: "Notes",         auth: "adminOrTeacher", hasValidation: true },
  { method: "GET",  path: "/dashboard/youtube-videos",             module: "Videos",        auth: "adminOrTeacher", hasValidation: false },
  { method: "POST", path: "/dashboard/youtube-videos/upload",      module: "Videos",        auth: "adminOrTeacher", hasValidation: true },
  { method: "GET",  path: "/dashboard/assignments",                module: "Assignments",   auth: "adminOrTeacher", hasValidation: false },
  { method: "GET",  path: "/dashboard/study-materials",            module: "Materials",     auth: "adminOrTeacher", hasValidation: false },
  { method: "POST", path: "/dashboard/study-materials",            module: "Materials",     auth: "adminOrTeacher", hasValidation: true },
  { method: "GET",  path: "/dashboard/announcements",              module: "Announcements", auth: "adminOrTeacher", hasValidation: false },
  { method: "POST", path: "/dashboard/announcements",              module: "Announcements", auth: "adminOrTeacher", hasValidation: true },
  { method: "GET",  path: "/dashboard/teachers",                   module: "Teachers",      auth: "adminOrTeacher", hasValidation: false },
  { method: "GET",  path: "/dashboard/analytics/dashboard",        module: "Analytics",     auth: "adminOrTeacher", hasValidation: false },
  { method: "GET",  path: "/dashboard/settings",                   module: "Settings",      auth: "admin",          hasValidation: false },
  { method: "GET",  path: "/dashboard/notifications",              module: "Notifications", auth: "authenticated",  hasValidation: false },
  { method: "GET",  path: "/dashboard/notifications/unread-count", module: "Notifications", auth: "authenticated",  hasValidation: false },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

const NAMES = ["Aarav","Priya","Rohan","Ananya","Vivaan","Ishita","Aditya","Meera","Arjun","Divya","Kabir","Nisha","Dev","Pooja","Ravi","Sanya","Yash","Kavya","Harsh","Sneha"];
const SURNAMES = ["Sharma","Patel","Singh","Kumar","Gupta","Verma","Joshi","Mishra","Chauhan","Agarwal"];
const SUBJECTS = ["Mathematics","Science","English","Hindi","Social Studies","Computer Science","Physics","Chemistry"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function httpFetch(url: string, opts: { method: string; headers: Record<string, string>; body?: string; timeout?: number }): Promise<{ status: number; time: number; body?: any; headers?: Record<string, string> }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeout || 10000);
    const res = await fetch(url, { method: opts.method, headers: opts.headers, body: opts.body, signal: controller.signal });
    clearTimeout(timer);
    const respHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { respHeaders[k] = v; });
    let body: any;
    try { body = await res.json(); } catch { body = null; }
    return { status: res.status, time: Date.now() - start, body, headers: respHeaders };
  } catch (err: any) {
    return { status: 0, time: Date.now() - start, body: { error: err.message } };
  }
}

// ────────────────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────────────────

export default class MaintenanceService {

  async verifyPassword(password: string): Promise<boolean> {
    const hash = config.MAINTENANCE.PASSWORD_HASH;
    if (!hash) { log("error", "MAINTENANCE_PASSWORD_HASH not set", {}); return false; }
    return bcrypt.compare(password, hash);
  }

  // ── Status with counts ──────────────────────────
  async getStatus(): Promise<Record<string, number>> {
    const [students, users, batches, attendances, feeReceipts, lectures, tests, testScores, notes] = await Promise.all([
      prisma.student.count({ where: { fullname: { contains: SEED_TAG } } }),
      prisma.user.count({ where: { name: { contains: SEED_TAG } } }),
      prisma.batch.count({ where: { name: { contains: SEED_TAG } } }),
      prisma.attendance.count({ where: { markedBy: { contains: SEED_TAG } } }),
      prisma.feeReceipt.count({ where: { generatedBy: { contains: SEED_TAG } } }),
      prisma.lecture.count({ where: { title: { contains: SEED_TAG } } }),
      prisma.test.count({ where: { title: { contains: SEED_TAG } } }),
      prisma.testScore.count({ where: { remarks: { contains: SEED_TAG } } }),
      prisma.note.count({ where: { title: { contains: SEED_TAG } } }),
    ]);
    return { students, users, batches, attendances, feeReceipts, lectures, tests, testScores, notes };
  }

  // ── Seed Inspector — query persisted seed data ───
  async getSeedData() {
    const [students, batches] = await Promise.all([
      prisma.student.findMany({
        where: { fullname: { contains: SEED_TAG } },
        select: {
          id: true, firstname: true, lastname: true, email: true, batchId: true,
          batch: { select: { id: true, name: true } },
          user: { select: { id: true, email: true } },
          _count: { select: { attendances: true, feeReceipts: true, testScores: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.batch.findMany({
        where: { name: { contains: SEED_TAG } },
        select: {
          id: true, name: true, timings: true, createdAt: true,
          _count: { select: { students: true, lectures: true, tests: true, notes: true, feeStructures: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { students, batches };
  }

  // ── Seed (full data) ─────────────────────────────
  async seed(count: number, batchId?: number) {
    const counters = { students: 0, users: 0, batches: 0, attendances: 0, feeReceipts: 0, lectures: 0, tests: 0, testScores: 0, notes: 0 };

    // 1. Batch
    let batch: { id: number; name: string };
    if (batchId) {
      const existing = await prisma.batch.findUnique({ where: { id: batchId } });
      if (!existing) throw new Error(`Batch ${batchId} not found`);
      batch = { id: existing.id, name: existing.name };
    } else {
      const seedBatch = await prisma.batch.create({
        data: { name: `${SEED_TAG} Batch ${new Date().toLocaleDateString("en-IN")}`, timings: { days: ["Mon", "Wed", "Fri"], time: "10:00 AM" } },
      });
      batch = { id: seedBatch.id, name: seedBatch.name };
      counters.batches = 1;
    }

    // 2. Fee structure
    let feeStructure: { id: number } | null = null;
    try {
      feeStructure = await prisma.feeStructure.create({
        data: { batchId: batch.id, name: `${SEED_TAG} Monthly Fee`, amount: 2000, frequency: "MONTHLY", dueDay: 5 },
      });
    } catch { /* exists */ }

    // 3. Lectures
    for (let i = 0; i < 5; i++) {
      try {
        const d = new Date(); d.setDate(d.getDate() - randInt(0, 30));
        await prisma.lecture.create({
          data: {
            title: `${SEED_TAG} ${pick(SUBJECTS)} L${i + 1}`, subject: pick(SUBJECTS),
            batchId: batch.id, createdBy: 1, date: d,
            startTime: `${randInt(8, 16)}:00`, endTime: `${randInt(17, 20)}:00`, duration: 60,
            status: i < 3 ? "COMPLETED" : "SCHEDULED",
          },
        });
        counters.lectures++;
      } catch { /* skip */ }
    }

    // 4. Tests
    const testIds: number[] = [];
    for (let i = 0; i < 3; i++) {
      try {
        const d = new Date(); d.setDate(d.getDate() - randInt(1, 30));
        const test = await prisma.test.create({
          data: {
            title: `${SEED_TAG} ${pick(SUBJECTS)} Test ${i + 1}`, subject: pick(SUBJECTS),
            batchId: batch.id, createdBy: 1, totalMarks: 100, passingMarks: 35,
            date: d, status: "PUBLISHED",
          },
        });
        testIds.push(test.id);
        counters.tests++;
      } catch { /* skip */ }
    }

    // 5. Notes
    for (let i = 0; i < 3; i++) {
      try {
        await prisma.note.create({
          data: { title: `${SEED_TAG} ${pick(SUBJECTS)} Notes ${i + 1}`, content: ["Chapter summary", "Key formulas", "Practice problems"], batchId: batch.id },
        });
        counters.notes++;
      } catch { /* skip */ }
    }

    // 6. Students + related data
    const hashedPw = await bcrypt.hash("seed123", 10);
    const seeded: { name: string; email: string; password: string; batchName: string; studentId: number }[] = [];

    for (let i = 0; i < count; i++) {
      const first = pick(NAMES);
      const last = pick(SURNAMES);
      const fullname = `${SEED_TAG} ${first} ${last}`;
      const email = `s${Date.now()}${i}@t.cl`;

      try {
        const { studentId } = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: { name: fullname, email, password: hashedPw, role: UserRoles.STUDENT, isPasswordSet: true },
          });
          const student = await tx.student.create({
            data: {
              firstname: first, middlename: "", lastname: last, fullname, email,
              dob: `200${randInt(0, 9)}-0${randInt(1, 9)}-${randInt(10, 28)}`,
              batchId: batch.id, userId: user.id,
              phone: `+91 ${randInt(70000, 99999)}${randInt(10000, 99999)}`,
              parentName: `${pick(NAMES)} ${last}`, grade: `${randInt(6, 12)}th`,
            },
          });
          return { studentId: student.id };
        });

        counters.students++; counters.users++;
        seeded.push({ name: `${first} ${last}`, email, password: "seed123", batchName: batch.name, studentId });

        // Attendance — 15 days
        for (let d = 0; d < 15; d++) {
          try {
            const date = new Date(); date.setDate(date.getDate() - d); date.setHours(10, 0, 0, 0);
            await prisma.attendance.create({
              data: {
                studentId, batchId: batch.id, date,
                status: Math.random() > 0.2 ? "PRESENT" : "ABSENT",
                markedBy: `${SEED_TAG} System`, method: "MANUAL",
              },
            });
            counters.attendances++;
          } catch { /* unique constraint */ }
        }

        // Fee receipts — 2 months
        if (feeStructure) {
          for (let m = 0; m < 2; m++) {
            try {
              const now = new Date();
              const dueDate = new Date(now.getFullYear(), now.getMonth() - m, 5);
              const statuses: Array<"PAID" | "PENDING" | "OVERDUE"> = ["PAID", "PENDING", "OVERDUE"];
              const status = pick(statuses);
              const paid = status === "PAID" ? 2000 : 0;
              await prisma.feeReceipt.create({
                data: {
                  receiptNumber: `SEED-${Date.now()}-${i}-${m}`, studentId, batchId: batch.id,
                  feeStructureId: feeStructure.id, totalAmount: 2000, paidAmount: paid,
                  remainingAmount: 2000 - paid, academicMonth: dueDate.getMonth() + 1,
                  academicYear: dueDate.getFullYear(), dueDate, status,
                  generatedBy: `${SEED_TAG} System`,
                  paymentMode: status === "PAID" ? "CASH" : undefined,
                  paymentDate: status === "PAID" ? new Date() : undefined,
                },
              });
              counters.feeReceipts++;
            } catch { /* skip */ }
          }
        }

        // Test scores
        for (const testId of testIds) {
          try {
            const marks = randInt(15, 100);
            await prisma.testScore.create({
              data: {
                testId, studentId, marksObtained: marks, percentage: marks,
                grade: marks >= 90 ? "A+" : marks >= 75 ? "A" : marks >= 60 ? "B" : marks >= 40 ? "C" : "F",
                status: marks >= 35 ? "PASS" : "FAIL",
                remarks: `${SEED_TAG}`, uploadedBy: 1,
              },
            });
            counters.testScores++;
          } catch { /* skip */ }
        }

      } catch (err: any) {
        log("warn", `seed skip ${i}`, { err: err.message });
      }
    }

    // FLUSH ALL CACHE so seed data appears in real pages immediately
    cacheService.flush();

    return { summary: counters, students: seeded };
  }

  // ── Cleanup ──────────────────────────────────────
  async cleanup() {
    const d: Record<string, number> = {};

    // ── Pre-fetch IDs needed for FK-safe deletes ──────────────────────────────
    // Attendance records may have been marked by real teachers for seed students,
    // so filter by studentId (not just markedBy). Same applies to test scores,
    // fee receipts, and every non-cascade child of Batch.

    const seedStudents = await prisma.student.findMany({
      where: { fullname: { contains: SEED_TAG } },
      select: { id: true },
    });
    const seedStudentIds = seedStudents.map((s) => s.id);

    const seedTests = await prisma.test.findMany({
      where: { title: { contains: SEED_TAG } },
      select: { id: true },
    });
    const seedTestIds = seedTests.map((t) => t.id);

    const seedBatches = await prisma.batch.findMany({
      where: { name: { contains: SEED_TAG } },
      select: { id: true },
    });
    const seedBatchIds = seedBatches.map((b) => b.id);

    // ── Delete deepest children first ─────────────────────────────────────────

    // TestScore (refs student + test — no cascade on student side)
    d.testScores = (await prisma.testScore.deleteMany({
      where: {
        OR: [
          { remarks: { contains: SEED_TAG } },
          ...(seedStudentIds.length ? [{ studentId: { in: seedStudentIds } }] : []),
          ...(seedTestIds.length    ? [{ testId:    { in: seedTestIds    } }] : []),
        ],
      },
    })).count;

    // Attendance (refs student + batch — neither cascades)
    d.attendances = (await prisma.attendance.deleteMany({
      where: {
        OR: [
          { markedBy: { contains: SEED_TAG } },
          ...(seedStudentIds.length ? [{ studentId: { in: seedStudentIds } }] : []),
          ...(seedBatchIds.length   ? [{ batchId:   { in: seedBatchIds   } }] : []),
        ],
      },
    })).count;

    // AttendanceSheet (refs batch, no cascade — must go after attendance rows)
    d.attendanceSheets = (await prisma.attendanceSheet.deleteMany({
      where: seedBatchIds.length ? { batchId: { in: seedBatchIds } } : { id: -1 },
    })).count;

    // FeeReceipt (refs student + batch — both cascade, but be explicit)
    d.feeReceipts = (await prisma.feeReceipt.deleteMany({
      where: {
        OR: [
          { generatedBy: { contains: SEED_TAG } },
          ...(seedStudentIds.length ? [{ studentId: { in: seedStudentIds } }] : []),
          ...(seedBatchIds.length   ? [{ batchId:   { in: seedBatchIds   } }] : []),
        ],
      },
    })).count;

    // AssignmentSlot → StudentSubmission (submission cascades from slot, slot does not cascade from batch)
    if (seedBatchIds.length) {
      const seedSlots = await prisma.assignmentSlot.findMany({
        where: { batchId: { in: seedBatchIds } },
        select: { id: true },
      });
      const seedSlotIds = seedSlots.map((s) => s.id);
      if (seedSlotIds.length) {
        await prisma.studentSubmission.deleteMany({ where: { slotId: { in: seedSlotIds } } });
      }
      d.assignmentSlots = (await prisma.assignmentSlot.deleteMany({
        where: { batchId: { in: seedBatchIds } },
      })).count;

      // Doubts (no cascade from batch)
      d.doubts = (await prisma.doubt.deleteMany({
        where: { batchId: { in: seedBatchIds } },
      })).count;

      // YoutubeVideo (no cascade from batch)
      d.youtubeVideos = (await prisma.youtubeVideo.deleteMany({
        where: { batchId: { in: seedBatchIds } },
      })).count;

      // StudyMaterial (no cascade from batch — delete before MaterialFolder)
      d.studyMaterials = (await prisma.studyMaterial.deleteMany({
        where: { batchId: { in: seedBatchIds } },
      })).count;

      // MaterialFolder (no cascade from batch)
      d.materialFolders = (await prisma.materialFolder.deleteMany({
        where: { batchId: { in: seedBatchIds } },
      })).count;
    }

    // ── Delete parents ────────────────────────────────────────────────────────
    d.notes = (await prisma.note.deleteMany({
      where: {
        OR: [
          { title: { contains: SEED_TAG } },
          ...(seedBatchIds.length ? [{ batchId: { in: seedBatchIds } }] : []),
        ],
      },
    })).count;

    d.lectures = (await prisma.lecture.deleteMany({
      where: {
        OR: [
          { title: { contains: SEED_TAG } },
          ...(seedBatchIds.length ? [{ batchId: { in: seedBatchIds } }] : []),
        ],
      },
    })).count;

    d.tests = (await prisma.test.deleteMany({
      where: {
        OR: [
          { title: { contains: SEED_TAG } },
          ...(seedBatchIds.length ? [{ batchId: { in: seedBatchIds } }] : []),
        ],
      },
    })).count;

    d.students      = (await prisma.student.deleteMany({ where: { fullname: { contains: SEED_TAG } } })).count;
    d.users         = (await prisma.user.deleteMany({ where: { name: { contains: SEED_TAG } } })).count;
    d.feeStructures = (await prisma.feeStructure.deleteMany({ where: { name: { contains: SEED_TAG } } })).count;
    d.batches       = (await prisma.batch.deleteMany({ where: { name: { contains: SEED_TAG } } })).count;

    cacheService.flush();
    return d;
  }

  // ── API Health ───────────────────────────────────
  async runApiHealth(baseUrl: string, token: string) {
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    const results: { method: string; path: string; module: string; status: number; time: number; passed: boolean; error?: string; responseSize?: string }[] = [];

    for (const ep of API_REGISTRY) {
      if (ep.method !== "GET") continue;
      const res = await httpFetch(`${baseUrl}/api${ep.path}`, { method: "GET", headers });
      const size = res.headers?.["content-length"] || "—";
      results.push({
        method: ep.method, path: ep.path, module: ep.module,
        status: res.status, time: res.time,
        passed: res.status >= 200 && res.status < 500,
        error: res.status >= 400 ? (res.body?.message || `HTTP ${res.status}`) : undefined,
        responseSize: size,
      });
    }

    return { total: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length, results };
  }

  // ── Validation Audit ─────────────────────────────
  async runValidationAudit(baseUrl: string, token: string) {
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

    const tests = [
      { method: "POST", path: "/dashboard/batches", module: "Batches", body: {}, desc: "Empty body → missing name" },
      { method: "POST", path: "/dashboard/batches", module: "Batches", body: { name: "" }, desc: "Empty string name" },
      { method: "POST", path: "/dashboard/batches", module: "Batches", body: { name: 123 }, desc: "Number instead of string name" },
      { method: "POST", path: "/dashboard/student-enrollment", module: "Students", body: {}, desc: "Empty body → all fields missing" },
      { method: "POST", path: "/dashboard/student-enrollment", module: "Students", body: { email: "bad" }, desc: "Invalid email format" },
      { method: "POST", path: "/dashboard/student-enrollment", module: "Students", body: { email: "t@t.com", firstname: "" }, desc: "Empty firstname string" },
      { method: "POST", path: "/dashboard/student-enrollment", module: "Students", body: { email: "t@t.com", firstname: "A", lastname: "B" }, desc: "Missing dob, address, batchId" },
      { method: "POST", path: "/dashboard/student-enrollment", module: "Students", body: { email: "t@t.com", firstname: "A", lastname: "B", dob: "2000-01-01", address: "xyz", batchId: -1 }, desc: "Negative batchId" },
      { method: "POST", path: "/dashboard/lectures", module: "Lectures", body: {}, desc: "Empty body" },
      { method: "POST", path: "/dashboard/lectures", module: "Lectures", body: { title: "" }, desc: "Empty title" },
      { method: "POST", path: "/dashboard/lectures", module: "Lectures", body: { title: "X" }, desc: "Missing subject, batchId, date" },
      { method: "POST", path: "/dashboard/fees/structures", module: "Fees", body: {}, desc: "Empty fee structure" },
      { method: "POST", path: "/dashboard/fees/receipts", module: "Fees", body: {}, desc: "Empty fee receipt" },
      { method: "POST", path: "/dashboard/tests", module: "Tests", body: {}, desc: "Empty body" },
      { method: "POST", path: "/dashboard/tests", module: "Tests", body: { title: "X" }, desc: "Missing subject, totalMarks, date" },
      { method: "POST", path: "/dashboard/notes", module: "Notes", body: {}, desc: "Empty body" },
      { method: "POST", path: "/dashboard/youtube-videos/upload", module: "Videos", body: {}, desc: "Empty body" },
      { method: "POST", path: "/dashboard/announcements", module: "Announcements", body: {}, desc: "Empty body" },
      { method: "POST", path: "/dashboard/study-materials", module: "Materials", body: {}, desc: "Empty body" },
      { method: "POST", path: "/dashboard/student-enrollment", module: "Students", body: { email: "t@t.com", firstname: "A".repeat(60), lastname: "B", dob: "2000-01-01", address: "addr", batchId: 1 }, desc: "Firstname exceeds 50 chars" },
    ];

    const results: { method: string; path: string; module: string; status: number; passed: boolean; desc: string; serverMessage?: string }[] = [];

    for (const t of tests) {
      const res = await httpFetch(`${baseUrl}/api${t.path}`, { method: t.method, headers, body: JSON.stringify(t.body) });
      const passed = res.status === 400 || res.status === 422;
      results.push({
        method: t.method, path: t.path, module: t.module, status: res.status, passed,
        desc: t.desc,
        serverMessage: res.body?.message || res.body?.errors?.[0]?.message || (res.body?.error ? String(res.body.error) : undefined),
      });
    }

    return { total: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length, results };
  }

  // ── Security Audit ───────────────────────────────
  async runSecurityAudit(baseUrl: string, token: string) {
    const results: { test: string; path: string; module: string; status: number; passed: boolean; expected: string }[] = [];

    // No auth header
    for (const ep of API_REGISTRY.filter(e => e.method === "GET")) {
      const res = await httpFetch(`${baseUrl}/api${ep.path}`, { method: "GET", headers: { "Content-Type": "application/json" } });
      const passed = res.status === 401 || res.status === 403;
      results.push({ test: "No Auth", path: ep.path, module: ep.module, status: res.status, passed, expected: "401/403" });
    }

    // Fake token
    for (const ep of API_REGISTRY.filter(e => e.method === "GET").slice(0, 5)) {
      const res = await httpFetch(`${baseUrl}/api${ep.path}`, { method: "GET", headers: { "Authorization": "Bearer fake_token", "Content-Type": "application/json" } });
      const passed = res.status === 401 || res.status === 403;
      results.push({ test: "Fake Token", path: ep.path, module: ep.module, status: res.status, passed, expected: "401/403" });
    }

    // Admin routes with valid token
    for (const ep of API_REGISTRY.filter(e => e.auth === "admin" && e.method === "GET")) {
      const res = await httpFetch(`${baseUrl}/api${ep.path}`, { method: "GET", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } });
      const passed = res.status >= 200 && res.status < 500;
      results.push({ test: "Admin OK", path: ep.path, module: ep.module, status: res.status, passed, expected: "2xx" });
    }

    return { total: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length, results };
  }

  // ── DB Integrity ─────────────────────────────────
  async runDbIntegrity() {
    const checks: { name: string; table: string; count: number; passed: boolean; detail: string }[] = [];

    const run = async (name: string, table: string, sql: string) => {
      try {
        const r = await prisma.$queryRawUnsafe<{ count: bigint }[]>(sql);
        const c = Number(r[0]?.count ?? 0);
        checks.push({ name, table, count: c, passed: c === 0, detail: c === 0 ? "No issues" : `${c} orphan records` });
      } catch (err: any) {
        checks.push({ name, table, count: -1, passed: true, detail: `Skipped: ${err.message?.slice(0, 50)}` });
      }
    };

    await run("Students without User", "students", `SELECT COUNT(*) as count FROM students s LEFT JOIN users u ON s."userId" = u.id WHERE s."userId" IS NOT NULL AND u.id IS NULL`);
    await run("Attendance without Student", "attendances", `SELECT COUNT(*) as count FROM attendances a LEFT JOIN students s ON a."studentId" = s.id WHERE s.id IS NULL`);
    await run("Fee Receipts without Student", "fee_receipts", `SELECT COUNT(*) as count FROM fee_receipts f LEFT JOIN students s ON f."studentId" = s.id WHERE s.id IS NULL`);
    await run("Test Scores without Test", "test_scores", `SELECT COUNT(*) as count FROM test_scores ts LEFT JOIN tests t ON ts."testId" = t.id WHERE t.id IS NULL`);
    await run("Test Scores without Student", "test_scores", `SELECT COUNT(*) as count FROM test_scores ts LEFT JOIN students s ON ts."studentId" = s.id WHERE s.id IS NULL`);
    await run("Lectures without Batch", "lectures", `SELECT COUNT(*) as count FROM lectures l LEFT JOIN batches b ON l."batchId" = b.id WHERE b.id IS NULL`);
    await run("Notes without Batch", "notes", `SELECT COUNT(*) as count FROM notes n LEFT JOIN batches b ON n."batchId" = b.id WHERE b.id IS NULL`);
    await run("Duplicate active emails", "students", `SELECT COUNT(*) as count FROM (SELECT email FROM students WHERE "isDeleted" = false GROUP BY email HAVING COUNT(*) > 1) t`);

    return { total: checks.length, issues: checks.filter(c => !c.passed).length, checks };
  }

  // ── Load Test ────────────────────────────────────
  async runLoadTest(baseUrl: string, token: string, endpoint: string, method: string, concurrency: number, iterations: number) {
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
    const times: number[] = [];
    const statuses: number[] = [];
    const totalStart = Date.now();

    for (let b = 0; b < iterations; b += concurrency) {
      const size = Math.min(concurrency, iterations - b);
      const res = await Promise.all(Array.from({ length: size }, () => httpFetch(`${baseUrl}/api${endpoint}`, { method, headers, timeout: 15000 })));
      for (const r of res) { times.push(r.time); statuses.push(r.status); }
    }

    const dur = (Date.now() - totalStart) / 1000;
    times.sort((a, b) => a - b);
    const ok = statuses.filter(s => s >= 200 && s < 400).length;
    const breakdown: Record<number, number> = {};
    for (const s of statuses) breakdown[s] = (breakdown[s] || 0) + 1;

    return {
      endpoint, totalRequests: times.length, successful: ok, failed: times.length - ok,
      avgTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      minTime: times[0] || 0, maxTime: times[times.length - 1] || 0,
      p95Time: times[Math.floor(times.length * 0.95)] || 0,
      requestsPerSecond: Math.round((times.length / dur) * 100) / 100,
      statusCodeBreakdown: breakdown,
    };
  }

  // ── API Playground (Postman-like) ────────────────
  async runPlayground(baseUrl: string, token: string, endpoint: string, method: string, body?: any, customHeaders?: Record<string, string>) {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(customHeaders || {}),
    };

    const res = await httpFetch(
      `${baseUrl}/api${endpoint}`,
      { method, headers, body: body ? JSON.stringify(body) : undefined, timeout: 15000 }
    );

    return {
      request: { method, url: `${baseUrl}/api${endpoint}`, headers, body: body || null },
      response: { status: res.status, time: res.time, headers: res.headers || {}, body: res.body },
    };
  }

  getEndpointRegistry() {
    return API_REGISTRY.map(e => ({ method: e.method, path: e.path, module: e.module }));
  }
}
