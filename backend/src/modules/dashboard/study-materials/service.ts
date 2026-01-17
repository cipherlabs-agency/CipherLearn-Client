import { prisma } from "../../../config/db.config";

export interface CreateStudyMaterialInput {
  title: string;
  description?: string;
  files: string[];
  batchId: number;
  category?: string;
  createdBy: string;
}

export interface UpdateStudyMaterialInput {
  title?: string;
  description?: string;
  files?: string[];
  category?: string;
}

export interface GetStudyMaterialsQuery {
  batchId?: number;
  category?: string;
  page?: number;
  limit?: number;
}

export class StudyMaterialService {
  async create(data: CreateStudyMaterialInput) {
    const material = await prisma.studyMaterial.create({
      data: {
        title: data.title,
        description: data.description,
        files: data.files,
        batchId: data.batchId,
        category: data.category,
        createdBy: data.createdBy,
      },
      include: {
        batch: { select: { id: true, name: true } },
      },
    });
    return material;
  }

  async getAll(query: GetStudyMaterialsQuery) {
    const { batchId, category, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: {
      isDeleted: boolean;
      batchId?: number;
      category?: string;
    } = {
      isDeleted: false,
    };

    if (batchId) where.batchId = batchId;
    if (category) where.category = category;

    const [materials, total] = await Promise.all([
      prisma.studyMaterial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          batch: { select: { id: true, name: true } },
        },
      }),
      prisma.studyMaterial.count({ where }),
    ]);

    return {
      materials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const material = await prisma.studyMaterial.findFirst({
      where: { id, isDeleted: false },
      include: {
        batch: { select: { id: true, name: true } },
      },
    });
    return material;
  }

  async update(id: number, data: UpdateStudyMaterialInput) {
    const material = await prisma.studyMaterial.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        files: data.files,
        category: data.category,
      },
      include: {
        batch: { select: { id: true, name: true } },
      },
    });
    return material;
  }

  async delete(id: number) {
    await prisma.studyMaterial.update({
      where: { id },
      data: { isDeleted: true },
    });
    return { success: true };
  }

  async getCategories() {
    const materials = await prisma.studyMaterial.findMany({
      where: { isDeleted: false, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    });
    return materials.map((m) => m.category).filter(Boolean);
  }
}

export const studyMaterialService = new StudyMaterialService();
