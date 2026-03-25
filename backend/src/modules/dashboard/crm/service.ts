import { prisma } from "../../../config/db.config";

export default class CRMService {
  async createLead(data: { name: string, email: string, phone?: string, batchId: number, message?: string }) {
    return prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        batchId: data.batchId,
        message: data.message,
        status: "NEW"
      }
    });
  }

  async getAllLeads() {
    return prisma.lead.findMany({
      include: { 
        batch: {
          select: { name: true }
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
