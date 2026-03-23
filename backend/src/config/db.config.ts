import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../prisma/generated/prisma/client";
import { config } from "./env.config";
import { log } from "../utils/logtail";

export class Database {
  private adapter: PrismaPg;
  public prisma: PrismaClient;

  constructor(connectionString: string = config.DB.URL) {
    // Explicit pool sizing for 300+ concurrent users.
    // Rule of thumb: pool = (max_concurrent_requests / avg_queries_per_request) * safety_factor
    // We target 300 concurrent users, each request ~2-3 queries → pool of 20-25 is sufficient.
    const poolConfig = {
      connectionString,
      max: Number(process.env.DB_POOL_MAX) || 20,
      min: Number(process.env.DB_POOL_MIN) || 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    };
    this.adapter = new PrismaPg(poolConfig);
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
    if (process.env.NODE_ENV === "production") return;
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
      log("error", "log.log failed", { err: error instanceof Error ? error.message : String(error) });
      console.error("Error connecting to the database:", error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log("Disconnected from the database.");
    } catch (error) {
      log("error", "log.log failed", { err: error instanceof Error ? error.message : String(error) });
      console.error("Error during disconnect:", error);
    }
  }
}

export default Database;

// Singleton — shared by all modules (avoids a second connection pool)
export const db = new Database();
export const prisma = db.prisma;
