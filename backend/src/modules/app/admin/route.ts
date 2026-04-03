import { Router } from "express";
import { isAdmin } from "../../auth/middleware";
import { validate } from "../../../middleware/validate";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import AppAdminController from "./controller";
import { adminValidations } from "./validation";

const router = Router();
const ctrl = new AppAdminController();

// All routes in this module require ADMIN role.
// Teachers cannot access these — isAdmin explicitly rejects TEACHER role.
router.use(isAdmin);

// ─── BATCHES ─────────────────────────────────────────────────────────────────
// GET  /app/admin/batches           — list all batches
// GET  /app/admin/batches/:id       — get batch detail
// POST /app/admin/batches           — create batch
// PUT  /app/admin/batches/:id       — update batch
// DELETE /app/admin/batches/:id     — soft-delete batch

router.get("/batches", appReadRateLimiter, ctrl.listBatches.bind(ctrl));
router.get("/batches/:id", appReadRateLimiter, ctrl.getBatch.bind(ctrl));
router.post("/batches", appWriteRateLimiter, validate(adminValidations.createBatch), ctrl.createBatch.bind(ctrl));
router.put("/batches/:id", appWriteRateLimiter, validate(adminValidations.updateBatch), ctrl.updateBatch.bind(ctrl));
router.delete("/batches/:id", ctrl.deleteBatch.bind(ctrl));

// ─── STUDENTS ────────────────────────────────────────────────────────────────
// GET  /app/admin/students          — list students (?batchId=&search=&page=&limit=)
// GET  /app/admin/students/:id      — get student detail
// POST /app/admin/students          — enroll new student
// PUT  /app/admin/students/:id      — update student
// DELETE /app/admin/students/:id    — soft-delete student

router.get("/students", appReadRateLimiter, ctrl.listStudents.bind(ctrl));
router.get("/students/:id", appReadRateLimiter, ctrl.getStudent.bind(ctrl));
router.post("/students", appWriteRateLimiter, validate(adminValidations.enrollStudent), ctrl.enrollStudent.bind(ctrl));
router.put("/students/:id", appWriteRateLimiter, validate(adminValidations.updateStudent), ctrl.updateStudent.bind(ctrl));
router.delete("/students/:id", ctrl.deleteStudent.bind(ctrl));

// ─── TEACHERS ────────────────────────────────────────────────────────────────
// GET  /app/admin/teachers          — list teachers (?search=&page=&limit=)
// GET  /app/admin/teachers/:id      — get teacher detail
// POST /app/admin/teachers          — create teacher account
// PUT  /app/admin/teachers/:id      — update teacher
// DELETE /app/admin/teachers/:id    — deactivate teacher

router.get("/teachers", appReadRateLimiter, ctrl.listTeachers.bind(ctrl));
router.get("/teachers/:id", appReadRateLimiter, ctrl.getTeacher.bind(ctrl));
router.post("/teachers", appWriteRateLimiter, validate(adminValidations.createTeacher), ctrl.createTeacher.bind(ctrl));
router.put("/teachers/:id", appWriteRateLimiter, validate(adminValidations.updateTeacher), ctrl.updateTeacher.bind(ctrl));
router.delete("/teachers/:id", ctrl.deleteTeacher.bind(ctrl));

// ─── FEE STRUCTURES ──────────────────────────────────────────────────────────
// GET  /app/admin/fee-structures    — list (?batchId= required)
// POST /app/admin/fee-structures    — create
// PUT  /app/admin/fee-structures/:id— update
// DELETE /app/admin/fee-structures/:id — deactivate

router.get("/fee-structures", appReadRateLimiter, ctrl.listFeeStructures.bind(ctrl));
router.post("/fee-structures", appWriteRateLimiter, validate(adminValidations.createFeeStructure), ctrl.createFeeStructure.bind(ctrl));
router.put("/fee-structures/:id", appWriteRateLimiter, validate(adminValidations.updateFeeStructure), ctrl.updateFeeStructure.bind(ctrl));
router.delete("/fee-structures/:id", ctrl.deleteFeeStructure.bind(ctrl));

export default router;
