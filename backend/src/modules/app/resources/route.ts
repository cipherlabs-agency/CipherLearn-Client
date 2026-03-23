import { Router } from "express";
import { resourcesController } from "./controller";
import { isStudent, isTeacher } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter, fileUploadRateLimiter } from "../../../middleware/rateLimiter";
import { materialUpload } from "../../../config/multer.config";
import { validate } from "../../../middleware/validate";
import { ResourcesValidations } from "./validation";

const router = Router();

// ==================== TEACHER ROUTES ====================

/**
 * GET /app/resources/teacher
 * Teacher: list their study materials
 *   ?tab=published|drafts|scheduled&subject=&batchId=&page=&limit=
 */
router.get(
  "/teacher",
  isTeacher,
  appReadRateLimiter,
  validate(ResourcesValidations.teacherListQuery, "query"),
  resourcesController.getTeacherMaterials.bind(resourcesController)
);

/**
 * POST /app/resources/teacher
 * Teacher: upload study material (100MB per file, max 5 files)
 * Body (multipart/form-data): title, batchId, files[], + optional fields
 *
 * Rate limit: 10 uploads per 5 min
 */
router.post(
  "/teacher",
  isTeacher,
  fileUploadRateLimiter,
  materialUpload.array("files", 5),
  validate(ResourcesValidations.createMaterial),
  resourcesController.createTeacherMaterial.bind(resourcesController)
);

/**
 * PUT /app/resources/teacher/:id/publish
 * Teacher: publish a draft or scheduled material
 * Must come BEFORE /:id to avoid route collision
 */
router.put(
  "/teacher/:id/publish",
  isTeacher,
  resourcesController.publishTeacherMaterial.bind(resourcesController)
);

/**
 * PUT /app/resources/teacher/:id
 * Teacher: update material details
 * Body (JSON): { title?, description?, subject?, chapter?, materialType?,
 *               materialStatus?, scheduledAt?, visibleBatchIds? }
 */
router.put(
  "/teacher/:id",
  isTeacher,
  appWriteRateLimiter,
  validate(ResourcesValidations.updateMaterial),
  resourcesController.updateTeacherMaterial.bind(resourcesController)
);

/**
 * DELETE /app/resources/teacher/:id
 * Teacher: soft-delete material
 */
router.delete(
  "/teacher/:id",
  isTeacher,
  resourcesController.deleteTeacherMaterial.bind(resourcesController)
);

// ==================== TEACHER FOLDER ROUTES ====================

/**
 * GET /app/resources/teacher/folders?batchId=
 * Teacher: list material folders for a batch
 */
router.get("/teacher/folders", isTeacher, appReadRateLimiter, resourcesController.getFolders.bind(resourcesController));

/**
 * POST /app/resources/teacher/folders
 * Teacher: create a folder
 * Body: { batchId, name }
 */
router.post("/teacher/folders", isTeacher, appWriteRateLimiter, validate(ResourcesValidations.createFolder), resourcesController.createFolder.bind(resourcesController));

/**
 * PUT /app/resources/teacher/folder/:id
 * Teacher: rename a folder
 * Body: { batchId, name }
 */
router.put("/teacher/folder/:id", isTeacher, appWriteRateLimiter, validate(ResourcesValidations.updateFolder), resourcesController.updateFolder.bind(resourcesController));

/**
 * DELETE /app/resources/teacher/folder/:id
 * Teacher: delete a folder
 * Body/query: { batchId }
 */
router.delete("/teacher/folder/:id", isTeacher, resourcesController.deleteFolder.bind(resourcesController));

// ==================== TEACHER VIDEO ROUTES ====================

/**
 * GET /app/resources/teacher/videos
 * Teacher: list YouTube videos for a batch
 *   ?batchId=&page=&limit=&search=
 */
router.get(
  "/teacher/videos",
  isTeacher,
  appReadRateLimiter,
  resourcesController.getTeacherVideos.bind(resourcesController)
);

/**
 * POST /app/resources/teacher/video
 * Teacher: add a YouTube video
 * Body: { url, title, batchId, description?, category?, publish?, notifyStudents? }
 */
router.post(
  "/teacher/video",
  isTeacher,
  appWriteRateLimiter,
  validate(ResourcesValidations.createVideo),
  resourcesController.createVideo.bind(resourcesController)
);

/**
 * PUT /app/resources/teacher/video/:id
 * Teacher: update a YouTube video
 */
router.put(
  "/teacher/video/:id",
  isTeacher,
  appWriteRateLimiter,
  validate(ResourcesValidations.updateVideo),
  resourcesController.updateVideo.bind(resourcesController)
);

/**
 * DELETE /app/resources/teacher/video/:id
 * Teacher: soft-delete a YouTube video
 */
router.delete(
  "/teacher/video/:id",
  isTeacher,
  resourcesController.deleteVideo.bind(resourcesController)
);

// ==================== STUDENT ROUTES ====================

/**
 * GET /app/resources/starred
 * Student: get all starred resources grouped by type (notes, studyMaterials, videos)
 */
router.get(
  "/starred",
  isStudent,
  appReadRateLimiter,
  resourcesController.getStarredResources.bind(resourcesController)
);

/**
 * POST /app/resources/starred
 * Student: star a resource
 * Body: { resourceType: "note"|"study_material"|"video", resourceId: number }
 */
router.post(
  "/starred",
  isStudent,
  appWriteRateLimiter,
  validate(ResourcesValidations.starResource),
  resourcesController.starResource.bind(resourcesController)
);

/**
 * DELETE /app/resources/starred
 * Student: unstar a resource
 * Body: { resourceType: "note"|"study_material"|"video", resourceId: number }
 */
router.delete(
  "/starred",
  isStudent,
  resourcesController.unstarResource.bind(resourcesController)
);

/**
 * GET /app/resources/videos
 * Student: YouTube videos for their batch
 *   ?search=&category=&limit=
 */
router.get(
  "/videos",
  isStudent,
  appReadRateLimiter,
  resourcesController.getVideos.bind(resourcesController)
);

/**
 * GET /app/resources/notes
 * Student: text notes for their batch
 *   ?search=&category=&limit=
 */
router.get(
  "/notes",
  isStudent,
  appReadRateLimiter,
  resourcesController.getNotes.bind(resourcesController)
);

/**
 * GET /app/resources/study-materials
 * Student: study materials (includes visibleBatchIds)
 *   ?search=&category=&limit=
 */
router.get(
  "/study-materials",
  isStudent,
  appReadRateLimiter,
  resourcesController.getStudyMaterials.bind(resourcesController)
);

export default router;
