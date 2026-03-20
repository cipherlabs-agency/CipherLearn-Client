import { Request, Response } from "express";
import { YoutubeVideo, UpdateYoutubeVideoInput, GetYoutubeVideosQuery } from "./types";
import YoutubeVideoService from "./service";
import { log } from "../../../utils/logtail";

const youtubeVideoService = new YoutubeVideoService();

export default class YoutubeVideoController {
  /**
   * Upload a new YouTube video
   * POST /youtube-videos/upload
   */
  async upload(req: Request, res: Response) {
    try {
      const {
        title,
        url,
        description,
        visibility,
        batchId,
        category,
      }: YoutubeVideo = req.body;

      const youtubeVideo = await youtubeVideoService.upload({
        title,
        url,
        description,
        visibility,
        batchId,
        category,
      });

      return res.status(201).json({
        success: true,
        message: "Video uploaded successfully",
        data: youtubeVideo,
      });
    } catch (error: any) {
      log("error", "dashboard.youtube-videos.status failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Get all videos with filtering and pagination
   * GET /youtube-videos
   */
  async getAll(req: Request, res: Response) {
    try {
      const query: GetYoutubeVideosQuery = {
        batchId: req.query.batchId ? Number(req.query.batchId) : undefined,
        category: req.query.category as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        search: req.query.search as string | undefined,
      };

      const result = await youtubeVideoService.getAll(query);

      return res.status(200).json({
        success: true,
        data: result.videos,
        pagination: result.pagination,
      });
    } catch (error) {
      log("error", "dashboard.youtube-videos.status failed", { err: error instanceof Error ? error.message : String(error) });
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Get videos for a specific batch
   * GET /youtube-videos/batch/:batchId
   */
  async getByBatch(req: Request, res: Response) {
    try {
      const { batchId } = req.params;

      const youtubeVideos = await youtubeVideoService.getByBatch(
        Number(batchId)
      );
      return res.status(200).json({ success: true, data: youtubeVideos });
    } catch (error: any) {
      log("error", "dashboard.youtube-videos.status failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message === "Batch not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Get a single video by ID
   * GET /youtube-videos/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const video = await youtubeVideoService.getById(Number(id));
      return res.status(200).json({ success: true, data: video });
    } catch (error: any) {
      log("error", "dashboard.youtube-videos.status failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message === "Video not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Update a video
   * PUT /youtube-videos/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateYoutubeVideoInput = req.body;

      const updatedVideo = await youtubeVideoService.update(Number(id), data);

      return res.status(200).json({
        success: true,
        message: "Video updated successfully",
        data: updatedVideo,
      });
    } catch (error: any) {
      log("error", "dashboard.youtube-videos.status failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Soft delete (draft) a video
   * PUT /youtube-videos/:videoId/draft
   */
  async draft(req: Request, res: Response) {
    try {
      const { videoId } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const draftedVideo = await youtubeVideoService.draft(
        Number(videoId),
        user
      );

      return res.status(200).json({
        success: true,
        message: "Video deleted successfully",
        data: draftedVideo,
      });
    } catch (error: any) {
      log("error", "dashboard.youtube-videos.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Permanently delete a video
   * DELETE /youtube-videos/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await youtubeVideoService.delete(Number(id));

      return res.status(200).json({
        success: true,
        message: "Video permanently deleted",
      });
    } catch (error: any) {
      log("error", "dashboard.youtube-videos.status failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Restore a soft-deleted video
   * PUT /youtube-videos/:id/restore
   */
  async restore(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const restoredVideo = await youtubeVideoService.restore(Number(id));

      return res.status(200).json({
        success: true,
        message: "Video restored successfully",
        data: restoredVideo,
      });
    } catch (error: any) {
      log("error", "dashboard.youtube-videos.status failed", { err: error instanceof Error ? error.message : String(error) });
      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }

  /**
   * Get video categories
   * GET /youtube-videos/categories
   */
  async getCategories(req: Request, res: Response) {
    try {
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;

      const categories = await youtubeVideoService.getCategories(batchId);

      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      log("error", "dashboard.youtube-videos.status failed", { err: error instanceof Error ? error.message : String(error) });
      return res
        .status(500)
        .json({ success: false, message: `Internal Server Error: ${error}` });
    }
  }
}
