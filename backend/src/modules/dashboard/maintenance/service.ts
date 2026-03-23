import bcrypt from "bcryptjs";
import { prisma } from "../../../config/db.config";
import { config } from "../../../config/env.config";
import { log } from "../../../utils/logtail";
import { UserRoles, AttendanceStatus, PaymentStatus, LectureStatus, TestStatus, ScoreStatus } from "../../../../prisma/generated/prisma/client";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const SEED_TAG = "[SEED]";

const FIRST_NAMES = [
  "Aarav", "Priya", "Rohan", "Ananya", "Vivaan", "Ishita", "Aditya", "Meera",
  "Arjun", "Divya", "Kabir", "Nisha", "Dev", "Pooja", "Ravi", "Sanya",
  "Yash", "Kavya", "Harsh", "Sneha", "Vikram", "Tanya", "Nikhil", "Riya",
  "Manish", "Sakshi", "Rahul", "Neha", "Akash", "Palak", "Deepak", "Shreya",
  "Kunal", "Anjali", "Gaurav", "Swati", "Varun", "Kriti", "Siddharth", "Mahi",
  "Pranav", "Bhavya", "Tushar", "Ritika", "Chirag", "Tanvi", "Amit", "Jyoti",
  "Suraj", "Diya",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Singh", "Kumar", "Gupta", "Verma", "Joshi", "Mishra",
  "Chauhan", "Agarwal", "Reddy", "Rao", "Nair", "Pillai", "Iyer", "Das",
  "Sinha", "Chopra", "Malhotra", "Mehta", "Shah", "Thakur", "Bhat", "Kulkarni",
  "Deshmukh",
];

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "Computer Science"];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

export default class MaintenanceService {
  /**
   * Verify the maintenance mode password against the bcrypt hash from env
   */
  async verifyPassword(password: string): Promise<boolean> {
    const hash = config.MAINTENANCE.PASSWORD_HASH;
    if (!hash) {
      log("error", "maintenance.verifyPassword: MAINTENANCE_PASSWORD_HASH not set", {});
      return false;
    }
    return bcrypt.compare(password, hash);
  }

  /**
   * Get counts of all SEED-tagged records across every table
   */
  async getStatus(): Promise<Record<string, number>> {
    const [
      students, users, batches, attendances, lectures,
      feeStructures, feeReceipts, tests, testScores,
      notes, youtubeVideos, assignments, studyMaterials
    ] = await Promise.all([
      prisma.student.count({ where: { fullname: { contains: SEED_TAG } } }),
      prisma.user.count({ where: { name: { contains: SEED_TAG } } }),
      prisma.batch.count({ where: { name: { contains: SEED_TAG } } }),
      prisma.attendance.count({ where: { markedBy: SEED_TAG } }),
      prisma.lecture.count({ where: { title: { contains: SEED_TAG } } }),
      prisma.feeStructure.count({ where: { name: { contains: SEED_TAG } } }),
      prisma.feeReceipt.count({ where: { generatedBy: SEED_TAG } }),
      prisma.test.count({ where: { title: { contains: SEED_TAG } } }),
      prisma.testScore.count({ where: { remarks: SEED_TAG } }),
      prisma.note.count({ where: { title: { contains: SEED_TAG } } }),
      prisma.youtubeVideo.count({ where: { title: { contains: SEED_TAG } } }),
      prisma.assignmentSlot.count({ where: { title: { contains: SEED_TAG } } }),
      prisma.studyMaterial.count({ where: { title: { contains: SEED_TAG } } }),
    ]);

    return {
      students, users, batches, attendances, lectures,
      feeStructures, feeReceipts, tests, testScores,
      notes, youtubeVideos, assignments, studyMaterials,
    };
  }

  /**
   * Seed N students + related data for a batch
   */
  async seed(count: number, batchId?: number): Promise<{
    summary: Record<string, number>;
    students: { name: string; email: string; password: string; batchName: string }[];
  }> {
    const counters = {
      students: 0, users: 0, attendances: 0, lectures: 0,
      feeStructures: 0, feeReceipts: 0, tests: 0, testScores: 0,
      notes: 0, youtubeVideos: 0, assignments: 0, studyMaterials: 0, batches: 0,
    };

    // 1. Resolve or create a batch
    let batch: { id: number; name: string };
    if (batchId) {
      const existing = await prisma.batch.findUnique({ where: { id: batchId } });
      if (!existing) throw new Error(`Batch with ID ${batchId} not found`);
      batch = { id: existing.id, name: existing.name };
    } else {
      const seedBatch = await prisma.batch.create({
        data: { name: `${SEED_TAG} Scalability Batch`, timings: { days: ["Mon", "Wed", "Fri"], time: "10:00 AM - 12:00 PM" } },
      });
      batch = { id: seedBatch.id, name: seedBatch.name };
      counters.batches = 1;
    }

    // 2. Create a fee structure for the batch
    const feeStructure = await prisma.feeStructure.create({
      data: {
        batchId: batch.id,
        name: `${SEED_TAG} Monthly Tuition`,
        amount: 2500,
        frequency: "MONTHLY",
        dueDay: 5,
        lateFee: 100,
        gracePeriod: 5,
      },
    });
    counters.feeStructures = 1;

    // 3. Create lectures for the batch (10)
    const lectureData = Array.from({ length: 10 }, (_, i) => ({
      title: `${SEED_TAG} Lecture ${i + 1} — ${pick(SUBJECTS)}`,
      subject: pick(SUBJECTS),
      batchId: batch.id,
      date: daysAgo(randInt(0, 30)),
      startTime: "10:00",
      endTime: "11:00",
      duration: 60,
      status: "COMPLETED" as const,
      createdBy: 1,
    }));

    await prisma.lecture.createMany({ data: lectureData });
    counters.lectures = 10;

    // 4. Create tests (3)
    const testIds: number[] = [];
    for (let t = 0; t < 3; t++) {
      const test = await prisma.test.create({
        data: {
          title: `${SEED_TAG} ${pick(["Unit Test", "Quiz", "Midterm"])} — ${pick(SUBJECTS)}`,
          subject: pick(SUBJECTS),
          batchId: batch.id,
          totalMarks: 100,
          passingMarks: 35,
          date: daysAgo(randInt(1, 30)),
          status: "PUBLISHED" as const,
          createdBy: 1,
        },
      });
      testIds.push(test.id);
    }
    counters.tests = 3;

    // 5. Create N students
    const hashedPassword = await bcrypt.hash("seed123", 10);
    const seededStudents: { name: string; email: string; password: string; batchName: string }[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);
      const fullname = `${SEED_TAG} ${firstName} ${lastName}`;
      const email = `seed_${Date.now()}_${i}@test.cipherlearn.com`;

      try {
        const result = await prisma.$transaction(async (tx) => {
          // Create user
          const user = await tx.user.create({
            data: {
              name: fullname,
              email,
              password: hashedPassword,
              role: UserRoles.STUDENT,
              isPasswordSet: true,
            },
          });
          counters.users++;

          // Create student
          const student = await tx.student.create({
            data: {
              firstname: firstName,
              middlename: "",
              lastname: lastName,
              fullname,
              email,
              dob: `200${randInt(0, 9)}-0${randInt(1, 9)}-${randInt(10, 28)}`,
              batchId: batch.id,
              userId: user.id,
              phone: `+91 ${randInt(70000, 99999)}${randInt(10000, 99999)}`,
              parentName: `${pick(FIRST_NAMES)} ${lastName}`,
              grade: `${randInt(6, 12)}th`,
            },
          });
          counters.students++;

          return student;
        });

        seededStudents.push({
          name: fullname,
          email,
          password: "seed123",
          batchName: batch.name,
        });

        // 6. Mock attendance (last 30 days)
        const attendanceRecords = Array.from({ length: 30 }, (_, d) => ({
          studentId: result.id,
          batchId: batch.id,
          date: daysAgo(d),
          status: Math.random() > 0.2 ? "PRESENT" as const : "ABSENT" as const,
          markedBy: SEED_TAG,
          method: "MANUAL" as const,
        }));

        await prisma.attendance.createMany({ data: attendanceRecords, skipDuplicates: true });
        counters.attendances += 30;

        // 7. Mock fee receipts (3 months)
        for (let m = 1; m <= 3; m++) {
          const paid = Math.random() > 0.3;
          const paidAmount = paid ? 2500 : randInt(0, 1500);
          const remainingAmount = Math.max(0, 2500 - paidAmount);
          let status: PaymentStatus = "PENDING";
          if (paidAmount >= 2500) status = "PAID";
          else if (paidAmount > 0) status = "PARTIAL";
          else if (m < 3) status = "OVERDUE";

          await prisma.feeReceipt.create({
            data: {
              receiptNumber: `SEED-${Date.now()}-${result.id}-${m}`,
              studentId: result.id,
              batchId: batch.id,
              feeStructureId: feeStructure.id,
              totalAmount: 2500,
              paidAmount,
              remainingAmount,
              academicMonth: m,
              academicYear: 2025,
              status,
              dueDate: new Date(2025, m - 1, 5),
              generatedBy: SEED_TAG,
            },
          });
          counters.feeReceipts++;
        }

        // 8. Mock test scores
        for (const testId of testIds) {
          const marks = randInt(20, 100);
          await prisma.testScore.create({
            data: {
              testId,
              studentId: result.id,
              marksObtained: marks,
              percentage: marks,
              grade: marks >= 90 ? "A+" : marks >= 75 ? "A" : marks >= 60 ? "B" : marks >= 35 ? "C" : "F",
              status: marks >= 35 ? "PASS" : "FAIL",
              remarks: SEED_TAG,
              uploadedBy: 1,
            },
          });
          counters.testScores++;
        }
      } catch (err: any) {
        log("warn", `maintenance.seed: Failed to create student ${i}`, { err: err.message });
      }
    }

    // 9. Create a few notes, videos, assignments, study materials for the batch
    await prisma.note.create({
      data: { title: `${SEED_TAG} Algebra Basics`, content: ["Quadratic equations", "Linear inequalities"], batchId: batch.id, category: "Mathematics" },
    });
    await prisma.note.create({
      data: { title: `${SEED_TAG} Thermodynamics`, content: ["Laws of thermodynamics", "Heat transfer"], batchId: batch.id, category: "Physics" },
    });
    counters.notes = 2;

    await prisma.youtubeVideo.create({
      data: { title: `${SEED_TAG} Calculus Crash Course`, url: `https://youtube.com/watch?v=seed_${Date.now()}_1`, batchId: batch.id, category: "Mathematics" },
    });
    await prisma.youtubeVideo.create({
      data: { title: `${SEED_TAG} Organic Chemistry`, url: `https://youtube.com/watch?v=seed_${Date.now()}_2`, batchId: batch.id, category: "Chemistry" },
    });
    counters.youtubeVideos = 2;

    await prisma.assignmentSlot.create({
      data: {
        title: `${SEED_TAG} Physics Worksheet`,
        subject: "Physics",
        batchId: batch.id,
        createdBy: SEED_TAG,
        dueDate: new Date(Date.now() + 7 * 86400000),
      },
    });
    counters.assignments = 1;

    await prisma.studyMaterial.create({
      data: {
        title: `${SEED_TAG} Chemistry Formula Sheet`,
        batchId: batch.id,
        files: [{ url: "https://example.com/formula.pdf", originalFilename: "formula.pdf", size: 1024 }],
        createdBy: SEED_TAG,
        category: "Chemistry",
        subject: "Chemistry",
      },
    });
    counters.studyMaterials = 1;

    return { summary: counters, students: seededStudents };
  }

  /**
   * Delete ALL seed-tagged data in correct FK order
   */
  async cleanup(): Promise<Record<string, number>> {
    const deleted: Record<string, number> = {};

    // Delete in reverse-dependency order
    const testScores = await prisma.testScore.deleteMany({ where: { remarks: SEED_TAG } });
    deleted.testScores = testScores.count;

    const attendances = await prisma.attendance.deleteMany({ where: { markedBy: SEED_TAG } });
    deleted.attendances = attendances.count;

    const feeReceipts = await prisma.feeReceipt.deleteMany({ where: { generatedBy: SEED_TAG } });
    deleted.feeReceipts = feeReceipts.count;

    const assignments = await prisma.assignmentSlot.deleteMany({ where: { title: { contains: SEED_TAG } } });
    deleted.assignments = assignments.count;

    const studyMaterials = await prisma.studyMaterial.deleteMany({ where: { title: { contains: SEED_TAG } } });
    deleted.studyMaterials = studyMaterials.count;

    const notes = await prisma.note.deleteMany({ where: { title: { contains: SEED_TAG } } });
    deleted.notes = notes.count;

    const videos = await prisma.youtubeVideo.deleteMany({ where: { title: { contains: SEED_TAG } } });
    deleted.youtubeVideos = videos.count;

    const feeStructures = await prisma.feeStructure.deleteMany({ where: { name: { contains: SEED_TAG } } });
    deleted.feeStructures = feeStructures.count;

    const tests = await prisma.test.deleteMany({ where: { title: { contains: SEED_TAG } } });
    deleted.tests = tests.count;

    const lectures = await prisma.lecture.deleteMany({ where: { title: { contains: SEED_TAG } } });
    deleted.lectures = lectures.count;

    // Delete students first (FK to User), then users
    const students = await prisma.student.deleteMany({ where: { fullname: { contains: SEED_TAG } } });
    deleted.students = students.count;

    const users = await prisma.user.deleteMany({ where: { name: { contains: SEED_TAG } } });
    deleted.users = users.count;

    const batches = await prisma.batch.deleteMany({ where: { name: { contains: SEED_TAG } } });
    deleted.batches = batches.count;

    return deleted;
  }
}
