import { Request, Response } from "express";
import CRMService from "./service";
import logger from "../../../utils/logger";

const crmService = new CRMService();

export default class CRMController {
  async createLead(req: Request, res: Response) {
    try {
      const { name, email, phone, batchId, message } = req.body;
      
      if (!name || !email || !batchId) {
        return res.status(400).json({ 
          success: false, 
          message: "Name, email and batchId are required" 
        });
      }

      const lead = await crmService.createLead({
        name,
        email,
        phone,
        batchId: Number(batchId),
        message
      });

      return res.status(201).json({ 
        success: true, 
        message: "Enquiry sent successfully",
        data: lead 
      });
    } catch (error) {
      logger.error("CRMController.createLead error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to process enrollment enquiry" 
      });
    }
  }

  async getAllLeads(req: Request, res: Response) {
    try {
      const leads = await crmService.getAllLeads();
      return res.status(200).json({ 
        success: true, 
        data: leads 
      });
    } catch (error) {
      logger.error("CRMController.getAllLeads error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch enquiries" 
      });
    }
  }
}
