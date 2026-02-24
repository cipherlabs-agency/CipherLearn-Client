import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../prisma/generated/prisma/client";
import { config } from "./env.config";
import { tenantStorage } from "../utils/tenantStorage";

/**
 * Models that are global / cross-tenant — NEVER auto-filtered by tenantId.
 * Either they have no tenantId column, or they must be queried globally.
 */
const BYPASS_MODELS = new Set([
  "Tenant",
  "SuperAdmin",
  "AdminAuditLog",
  "PlatformConfig",
  "TenantConfig",
  "TenantQuotaOverride",
  "PasswordResetToken",
  "TokenBlacklist",        // Token revocation is global — check regardless of tenant
  "InstagramAccount",
  "AutomationRule",
  "AutomationLog",
]);

/**
 * Operations where we inject tenantId into `where` (read / mutate by filter).
 */
const WHERE_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

/**
 * Operations where we inject tenantId into `data` (creates).
 */
const CREATE_OPS = new Set(["create", "createMany"]);

export class Database {
  private adapter: PrismaPg;
  public prisma: PrismaClient;

  constructor(connectionString: string = config.DB.URL) {
    this.adapter = new PrismaPg({ connectionString });
    this.prisma = new PrismaClient({
      adapter: this.adapter,
      log: [
        { level: "query", emit: "event" },
        { level: "error", emit: "stdout" },
        { level: "info", emit: "stdout" },
        { level: "warn", emit: "stdout" },
      ],
    });

    // @ts-ignore
    this.prisma.$on("query", this.defaultQueryLogger);
  }

  private defaultQueryLogger = (e: Prisma.QueryEvent): void => {
    const params = Array.isArray(e.params) ? e.params : [String(e.params)];
    console.log(`Query: ${e.query}`);
    console.log(`Params: ${params.join(", ")}`);
    console.log(`Duration: ${e.duration.toFixed(3)}ms`);
  };

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log("Connected to the database successfully.");
    } catch (error) {
      console.error("Error connecting to the database:", error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log("Disconnected from the database.");
    } catch (error) {
      console.error("Error during disconnect:", error);
    }
  }
}

const dbInstance = new Database();

/**
 * Extended Prisma client that auto-injects `tenantId` from AsyncLocalStorage
 * into every query on tenant-scoped models.
 *
 * - If tenantStorage has no value (migration scripts, cleanup jobs, portal routes),
 *   queries run without tenant filter — backward compatible.
 * - If tenantStorage has a tenantId, it is transparently injected.
 * - BYPASS_MODELS are never filtered (global tables).
 */
export const prisma = dbInstance.prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        const tenantId = tenantStorage.getStore();

        if (tenantId !== undefined && !BYPASS_MODELS.has(model)) {
          if (WHERE_OPS.has(operation)) {
            args.where = { ...(args.where ?? {}), tenantId };
          } else if (operation === "create") {
            args.data = { ...(args.data ?? {}), tenantId };
          } else if (operation === "createMany") {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: any) => ({ ...d, tenantId }));
            } else {
              args.data = { ...(args.data ?? {}), tenantId };
            }
          } else if (operation === "upsert") {
            args.where = { ...(args.where ?? {}), tenantId };
            args.create = { ...(args.create ?? {}), tenantId };
            // do not add tenantId to update — it shouldn't change
          }
        }

        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;

export default Database;
