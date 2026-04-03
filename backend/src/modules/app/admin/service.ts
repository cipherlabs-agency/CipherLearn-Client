import { UserRoles } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import { sendAccountRegistrationEmail } from "../../../utils/email";
import { invalidateAfterBatchMutation } from "../../../cache/invalidation";
import { invalidateAfterStudentMutation } from "../../../cache/invalidation";
import { invalidateAfterFeesMutation } from "../../../cache/invalidation";
import logger from "../../../utils/logger";
import type {
  AdminBatchListItem,
  CreateBatchInput,
  UpdateBatchInput,
  AdminStudentListItem,
  EnrollStudentInput,
  UpdateStudentInput,
  AdminTeacherListItem,
  CreateTeacherInput,
  UpdateTeacherInput,
  CreateFeeStructureInput,
  UpdateFeeStructureInput,
  AdminFeeStructureListItem,
} from "./types";

// ─── BATCH ────────────────────────────────────────────────────────────────────

export async function listBatches(): Promise<AdminBatchListItem[]> {
  const batches = await prisma.batch.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      timings: true,
      totalStudents: true,
      createdAt: true,
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return batches.map((b) => ({
    ...b,
    studentCount: b._count.students,
  }));
}

export async function getBatchById(id: number) {
  const batch = await prisma.batch.findFirst({
    where: { id, isDeleted: false },
    include: { _count: { select: { students: true } } },
  });
  if (!batch) throw new Error("Batch not found");
  return { ...batch, studentCount: batch._count.students };
}

export async function createBatch(data: CreateBatchInput) {
  const batch = await prisma.batch.create({
    data: { name: data.name, timings: data.timings as any ?? null },
  });
  invalidateAfterBatchMutation();
  return batch;
}

export async function updateBatch(id: number, data: UpdateBatchInput) {
  const existing = await prisma.batch.findFirst({ where: { id, isDeleted: false } });
  if (!existing) throw new Error("Batch not found");
  const updated = await prisma.batch.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.timings !== undefined && { timings: data.timings as any }),
    },
  });
  invalidateAfterBatchMutation(id);
  return updated;
}

export async function deleteBatch(id: number) {
  const existing = await prisma.batch.findFirst({ where: { id, isDeleted: false } });
  if (!existing) throw new Error("Batch not found");
  await prisma.batch.update({ where: { id }, data: { isDeleted: true } });
  invalidateAfterBatchMutation(id);
}

// ─── STUDENT ──────────────────────────────────────────────────────────────────

export async function listStudents(opts: { batchId?: number; search?: string; page: number; limit: number }) {
  const { batchId, search, page, limit } = opts;
  const where: Record<string, unknown> = { isDeleted: false };
  if (batchId) where.batchId = batchId;
  if (search) where.fullname = { contains: search, mode: "insensitive" };

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      include: {
        batch: { select: { id: true, name: true } },
        user: { select: { id: true, isPasswordSet: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const data: AdminStudentListItem[] = students.map((s) => ({
    id: s.id,
    fullname: s.fullname,
    email: s.email,
    phone: s.phone,
    batchId: s.batchId,
    batch: s.batch ?? null,
    grade: s.grade,
    instituteId: s.instituteId,
    isDeleted: s.isDeleted,
    createdAt: s.createdAt,
    userId: s.userId,
    isPasswordSet: s.user?.isPasswordSet ?? false,
  }));

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getStudentById(id: number): Promise<AdminStudentListItem> {
  const s = await prisma.student.findFirst({
    where: { id, isDeleted: false },
    include: {
      batch: { select: { id: true, name: true } },
      user: { select: { id: true, isPasswordSet: true } },
    },
  });
  if (!s) throw new Error("Student not found");
  return {
    id: s.id, fullname: s.fullname, email: s.email, phone: s.phone,
    batchId: s.batchId, batch: s.batch ?? null, grade: s.grade,
    instituteId: s.instituteId, isDeleted: s.isDeleted, createdAt: s.createdAt,
    userId: s.userId, isPasswordSet: s.user?.isPasswordSet ?? false,
  };
}

export async function enrollStudent(data: EnrollStudentInput) {
  const email = data.email.toLowerCase();

  const [existingStudent, existingUser, batch] = await Promise.all([
    prisma.student.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { email } }),
    prisma.batch.findUnique({ where: { id: data.batchId } }),
  ]);

  if (existingStudent) throw new Error("Student with this email already exists");
  if (existingUser) throw new Error("A user with this email already exists");
  if (!batch) throw new Error("Batch not found");

  const fullname = [data.firstname, data.middlename, data.lastname].filter(Boolean).join(" ");

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: fullname, email, password: null, role: UserRoles.STUDENT, isPasswordSet: false },
    });
    return tx.student.create({
      data: {
        firstname: data.firstname, middlename: data.middlename, lastname: data.lastname,
        fullname, email, dob: data.dob, batchId: data.batchId, address: data.address,
        phone: data.phone ?? null, parentName: data.parentName ?? null,
        grade: data.grade ?? null, instituteId: data.instituteId ?? null, userId: user.id,
      },
    });
  });

  invalidateAfterStudentMutation(undefined, data.batchId);
  sendAccountRegistrationEmail(email, fullname, "STUDENT").catch((e) =>
    logger.error("Failed to send student registration email:", e)
  );

  return result;
}

export async function updateStudent(id: number, data: UpdateStudentInput) {
  const existing = await prisma.student.findFirst({ where: { id, isDeleted: false } });
  if (!existing) throw new Error("Student not found");

  if (data.batchId) {
    const batch = await prisma.batch.findFirst({ where: { id: data.batchId, isDeleted: false } });
    if (!batch) throw new Error("Batch not found");
  }

  const fullname = data.firstname || data.middlename || data.lastname
    ? [
        data.firstname ?? existing.firstname,
        data.middlename ?? existing.middlename,
        data.lastname ?? existing.lastname,
      ].filter(Boolean).join(" ")
    : undefined;

  const updated = await prisma.student.update({
    where: { id },
    data: {
      ...(data.firstname && { firstname: data.firstname }),
      ...(data.middlename && { middlename: data.middlename }),
      ...(data.lastname && { lastname: data.lastname }),
      ...(fullname && { fullname }),
      ...(data.dob && { dob: data.dob }),
      ...(data.batchId && { batchId: data.batchId }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.parentName !== undefined && { parentName: data.parentName }),
      ...(data.grade !== undefined && { grade: data.grade }),
      ...(data.instituteId !== undefined && { instituteId: data.instituteId }),
    },
  });

  invalidateAfterStudentMutation(id, data.batchId ?? existing.batchId ?? undefined);
  return updated;
}

export async function deleteStudent(id: number) {
  const existing = await prisma.student.findFirst({ where: { id, isDeleted: false } });
  if (!existing) throw new Error("Student not found");
  await prisma.student.update({ where: { id }, data: { isDeleted: true } });
  invalidateAfterStudentMutation(id, existing.batchId ?? undefined);
}

// ─── TEACHER ──────────────────────────────────────────────────────────────────

export async function listTeachers(opts: { search?: string; page: number; limit: number }) {
  const { search, page, limit } = opts;
  const where = {
    role: UserRoles.TEACHER,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [total, teachers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, isPasswordSet: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: teachers as AdminTeacherListItem[],
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTeacherById(id: number): Promise<AdminTeacherListItem> {
  const user = await prisma.user.findFirst({
    where: { id, role: UserRoles.TEACHER },
    select: { id: true, name: true, email: true, isPasswordSet: true, createdAt: true },
  });
  if (!user) throw new Error("Teacher not found");
  return user as AdminTeacherListItem;
}

export async function createTeacher(data: CreateTeacherInput): Promise<AdminTeacherListItem> {
  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with this email already exists");

  const user = await prisma.user.create({
    data: { name: data.name, email, password: null, role: UserRoles.TEACHER, isPasswordSet: false },
    select: { id: true, name: true, email: true, isPasswordSet: true, createdAt: true },
  });

  sendAccountRegistrationEmail(email, data.name, "TEACHER").catch((e) =>
    logger.error("Failed to send teacher registration email:", e)
  );

  return user as AdminTeacherListItem;
}

export async function updateTeacher(id: number, data: UpdateTeacherInput): Promise<AdminTeacherListItem> {
  const existing = await prisma.user.findFirst({ where: { id, role: UserRoles.TEACHER } });
  if (!existing) throw new Error("Teacher not found");

  if (data.email) {
    const emailConflict = await prisma.user.findFirst({
      where: { email: data.email.toLowerCase(), id: { not: id } },
    });
    if (emailConflict) throw new Error("Email already in use");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email.toLowerCase() }),
    },
    select: { id: true, name: true, email: true, isPasswordSet: true, createdAt: true },
  });

  return updated as AdminTeacherListItem;
}

export async function deleteTeacher(id: number) {
  const existing = await prisma.user.findFirst({ where: { id, role: UserRoles.TEACHER } });
  if (!existing) throw new Error("Teacher not found");
  // Soft-delete: lock the account by setting a far-future lockedUntil
  await prisma.user.update({
    where: { id },
    data: { lockedUntil: new Date("2099-12-31") },
  });
}

// ─── FEE STRUCTURE ───────────────────────────────────────────────────────────

export async function listFeeStructures(batchId: number): Promise<AdminFeeStructureListItem[]> {
  const structures = await prisma.feeStructure.findMany({
    where: { batchId },
    orderBy: { createdAt: "desc" },
  });
  return structures as unknown as AdminFeeStructureListItem[];
}

export async function createFeeStructure(data: CreateFeeStructureInput): Promise<AdminFeeStructureListItem> {
  const batch = await prisma.batch.findFirst({ where: { id: data.batchId, isDeleted: false } });
  if (!batch) throw new Error("Batch not found");

  const existing = await (prisma.feeStructure as any).findUnique({
    where: { batchId_name: { batchId: data.batchId, name: data.name } },
  });
  if (existing) throw new Error(`Fee structure "${data.name}" already exists for this batch`);

  const structure = await prisma.feeStructure.create({
    data: {
      batchId: data.batchId,
      name: data.name,
      amount: data.amount,
      frequency: data.frequency as any,
      dueDay: data.dueDay ?? 5,
    },
  });

  invalidateAfterFeesMutation(data.batchId);
  return structure as unknown as AdminFeeStructureListItem;
}

export async function updateFeeStructure(id: number, data: UpdateFeeStructureInput): Promise<AdminFeeStructureListItem> {
  const existing = await prisma.feeStructure.findUnique({ where: { id } });
  if (!existing) throw new Error("Fee structure not found");

  const updated = await prisma.feeStructure.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.frequency !== undefined && { frequency: data.frequency as any }),
      ...(data.dueDay !== undefined && data.dueDay !== null && { dueDay: data.dueDay }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  invalidateAfterFeesMutation(existing.batchId);
  return updated as unknown as AdminFeeStructureListItem;
}

export async function deleteFeeStructure(id: number) {
  const existing = await prisma.feeStructure.findUnique({ where: { id } });
  if (!existing) throw new Error("Fee structure not found");
  await prisma.feeStructure.update({ where: { id }, data: { isActive: false } });
  invalidateAfterFeesMutation(existing.batchId);
}
