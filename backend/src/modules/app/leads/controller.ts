import { Request, Response } from "express";
import CRMService from "../../dashboard/crm/service";
import logger from "../../../utils/logger";

/**
 * App leads controller (ADMIN) — list CRM leads captured from landing pages.
 * Reuses the dashboard CRMService.getAllLeads(filters).
 */
const crmService = new CRMService();

export class AppLeadsController {
  // GET /app/admin/leads?status=&batchId=&page=&limit=
  async listLeads(req: Request, res: Response) {
    try {
      const q = req.query;
      const result = await crmService.getAllLeads({
        batchId: q.batchId ? Number(q.batchId) : undefined,
        status: q.status as string | undefined,
        page: q.page ? Number(q.page) : undefined,
        limit: q.limit ? Number(q.limit) : undefined,
      });
      return res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      logger.error("AppLeads.listLeads error:", error);
      return res.status(500).json({ success: false, message: "Failed to load leads" });
    }
  }
}

export const appLeadsController = new AppLeadsController();
