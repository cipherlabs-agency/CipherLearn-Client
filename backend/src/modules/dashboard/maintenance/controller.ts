import type { Request, Response } from "express";
import MaintenanceService from "./service";
import { log } from "../../../utils/logtail";
import logger from "../../../utils/logger";
import { sendToUser, sendTestNotification } from "../../../utils/pushNotifications";
import { config } from "../../../config/env.config";
import { prisma } from "../../../config/db.config";

const service = new MaintenanceService();

export default class MaintenanceController {

  async authenticate(req: Request, res: Response): Promise<Response> {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ success: false, message: "Password required" });
      const valid = await service.verifyPassword(password);
      if (!valid) return res.status(403).json({ success: false, message: "Invalid password" });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      log("error", "maintenance.auth", { err: error.message });
      return res.status(500).json({ success: false, message: "Internal error" });
    }
  }

  async getStatus(req: Request, res: Response): Promise<Response> {
    try {
      const status = await service.getStatus();
      return res.status(200).json({ success: true, data: status });
    } catch (error: any) {
      log("error", "maintenance.status", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSeedData(req: Request, res: Response): Promise<Response> {
    try {
      const data = await service.getSeedData();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      log("error", "maintenance.seedData", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async seed(req: Request, res: Response): Promise<Response> {
    try {
      const { password, count = 10, batchId } = req.body;
      const valid = await service.verifyPassword(password);
      if (!valid) return res.status(403).json({ success: false, message: "Invalid password" });
      if (count < 1 || count > 500) return res.status(400).json({ success: false, message: "Count: 1-500" });
      const result = await service.seed(count, batchId || undefined);
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "maintenance.seed", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async cleanup(req: Request, res: Response): Promise<Response> {
    try {
      const { password } = req.body;
      const valid = await service.verifyPassword(password);
      if (!valid) return res.status(403).json({ success: false, message: "Invalid password" });
      const result = await service.cleanup();
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "maintenance.cleanup", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async apiHealth(req: Request, res: Response): Promise<Response> {
    try {
      const { baseUrl, token } = req.body;
      if (!baseUrl || !token) return res.status(400).json({ success: false, message: "baseUrl and token required" });
      const result = await service.runApiHealth(baseUrl, token);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "maintenance.apiHealth", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async validationAudit(req: Request, res: Response): Promise<Response> {
    try {
      const { baseUrl, token } = req.body;
      if (!baseUrl || !token) return res.status(400).json({ success: false, message: "baseUrl and token required" });
      const result = await service.runValidationAudit(baseUrl, token);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "maintenance.validation", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async securityAudit(req: Request, res: Response): Promise<Response> {
    try {
      const { baseUrl, token } = req.body;
      if (!baseUrl || !token) return res.status(400).json({ success: false, message: "baseUrl and token required" });
      const result = await service.runSecurityAudit(baseUrl, token);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "maintenance.security", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async dbIntegrity(req: Request, res: Response): Promise<Response> {
    try {
      const result = await service.runDbIntegrity();
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "maintenance.dbIntegrity", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async loadTest(req: Request, res: Response): Promise<Response> {
    try {
      const { baseUrl, token, endpoint, method = "GET", concurrency = 5, iterations = 50 } = req.body;
      if (!baseUrl || !token || !endpoint) return res.status(400).json({ success: false, message: "baseUrl, token, endpoint required" });
      if (iterations > 200) return res.status(400).json({ success: false, message: "Max 200 iterations" });
      const result = await service.runLoadTest(baseUrl, token, endpoint, method, concurrency, iterations);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "maintenance.loadTest", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async playground(req: Request, res: Response): Promise<Response> {
    try {
      const { baseUrl, token, endpoint, method = "GET", body, customHeaders } = req.body;
      if (!baseUrl || !token || !endpoint) return res.status(400).json({ success: false, message: "baseUrl, token, endpoint required" });
      const result = await service.runPlayground(baseUrl, token, endpoint, method, body, customHeaders);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "maintenance.playground", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getEndpoints(req: Request, res: Response): Promise<Response> {
    try {
      const endpoints = service.getEndpointRegistry();
      return res.status(200).json({ success: true, data: endpoints });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /dashboard/maintenance/test-notification
   * Send a test push notification via OneSignal for debugging.
   *
   * Body: {
   *   userId?: number       — Send to a specific user (by DB user ID)
   *   title: string         — Notification title
   *   body: string          — Notification body text
   *   data?: object         — Optional custom data payload
   *   sendToAll?: boolean   — If true, sends to ALL subscribed OneSignal users
   * }
   *
   * Returns: OneSignal API response with notification ID, recipient count, and debug info.
   */
  async testNotification(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, title, body, data, sendToAll } = req.body;

      if (!title || !body) {
        return res.status(400).json({
          success: false,
          message: "title and body are required",
        });
      }

      // Check OneSignal config
      const appId = config.ONESIGNAL.APP_ID;
      const apiKey = config.ONESIGNAL.REST_API_KEY;

      if (!appId || !apiKey) {
        return res.status(400).json({
          success: false,
          message: "OneSignal not configured. Set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in .env",
          debug: {
            ONESIGNAL_APP_ID: appId ? "✅ Set" : "❌ Missing",
            ONESIGNAL_REST_API_KEY: apiKey ? "✅ Set" : "❌ Missing",
          },
        });
      }

      logger.info("[Maintenance] Test notification requested", {
        userId,
        title,
        body,
        sendToAll,
      });

      let result;

      if (sendToAll) {
        // Send to all subscribed users via OneSignal "included_segments"
        const response = await fetch("https://api.onesignal.com/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${apiKey}`,
          },
          body: JSON.stringify({
            app_id: appId,
            included_segments: ["Subscribed Users"],
            headings: { en: title },
            contents: { en: body },
            data: data || {},
          }),
        });
        result = await response.json();
      } else if (userId) {
        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: Number(userId) },
          select: { id: true, name: true, email: true, role: true },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: `User with ID ${userId} not found`,
          });
        }

        result = await sendTestNotification(
          [String(userId)],
          title,
          body,
          data
        );

        return res.status(200).json({
          success: true,
          message: `Test notification sent to ${user.name} (${user.email})`,
          data: {
            targetUser: user,
            onesignalResponse: result,
            debug: {
              externalUserId: String(userId),
              timestamp: new Date().toISOString(),
            },
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Provide either userId (number) or sendToAll: true",
        });
      }

      return res.status(200).json({
        success: true,
        message: sendToAll
          ? "Test notification sent to all subscribed users"
          : "Test notification sent",
        data: {
          onesignalResponse: result,
          debug: {
            timestamp: new Date().toISOString(),
            configStatus: {
              ONESIGNAL_APP_ID: "✅ Set",
              ONESIGNAL_REST_API_KEY: "✅ Set",
            },
          },
        },
      });
    } catch (error: any) {
      logger.error("[Maintenance] Test notification failed", {
        err: error.message,
        stack: error.stack,
      });
      log("error", "maintenance.testNotification", { err: error.message });
      return res.status(500).json({
        success: false,
        message: `Test notification failed: ${error.message}`,
        debug: { stack: error.stack },
      });
    }
  }
}
