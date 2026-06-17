import { Prisma } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";

export interface LeadFilters {
  batchId?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export interface LeadListResult {
  data: Awaited<ReturnType<typeof prisma.lead.findMany>>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default class CRMService {
  async createLead(data: { name: string; email: string; phone?: string; batchId: number; message?: string }) {
    return prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        batchId: data.batchId,
        message: data.message,
        status: "NEW",
      },
    });
  }

  async getAllLeads(filters: LeadFilters = {}): Promise<LeadListResult> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: { batch: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
