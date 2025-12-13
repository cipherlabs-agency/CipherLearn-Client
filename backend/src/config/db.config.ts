import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../prisma/generated/prisma/client";
import { config } from "./env.config";

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

    this.prisma.$on("query", this.defaultQueryLogger);
  }

  private defaultQueryLogger = (e: Prisma.QueryEvent): void => {
    const params = Array.isArray(e.params) ? e.params : [String(e.params)];
    console.log(`Query: ${e.query}`);
    console.log(`Params: ${params.join(", ")}`);
    console.log(`Duration: ${e.duration}ms`);
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

export default Database;
export const prisma = new Database().prisma;
