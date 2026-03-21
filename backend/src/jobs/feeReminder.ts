import cron from "node-cron";
import { prisma } from "../config/db.config";
import logger from "../utils/logger";

/**
 * Fee Reminder Job
 * 
 * Runs every day at 09:00 AM.
 * Scans `FeeReceipt` to find pending/partial payments due in exactly 3 days.
 * Generates an in-app `WARNING` notification for each associated student.
 */
export function startFeeReminderJob() {
  // Run every day at 9:00 AM server time
  cron.schedule("0 9 * * *", async () => {
    logger.info("Running daily fee reminder job...");
    try {
      const now = new Date();
      
      // Calculate start and end of the day exactly 3 days from now
      const in3DaysStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
      const in3DaysEnd = new Date(in3DaysStart);
      in3DaysEnd.setDate(in3DaysEnd.getDate() + 1);

      // Find all unpaid fee receipts due on that day
      const upcomingDues = await prisma.feeReceipt.findMany({
        where: {
          status: { in: ["PENDING", "PARTIAL"] },
          remainingAmount: { gt: 0 },
          dueDate: {
            gte: in3DaysStart,
            lt: in3DaysEnd,
          },
        },
        include: {
          student: {
            select: { userId: true },
          },
          batch: {
            select: { id: true, name: true },
          },
        },
      });

      if (upcomingDues.length === 0) {
        logger.info("No fees due in exactly 3 days. Job finished.");
        return;
      }

      logger.info(`Found ${upcomingDues.length} upcoming fee dues. Generating notifications...`);

      let createdCount = 0;
      for (const receipt of upcomingDues) {
        if (!receipt.student?.userId) continue;

        await prisma.notification.create({
          data: {
            userId: receipt.student.userId,
            title: "Fee Due Reminder",
            message: `Your fee installment of ₹${receipt.remainingAmount} for ${receipt.batch.name} is due on ${receipt.dueDate.toLocaleDateString()}. Please ensure timely payment to avoid late fees.`,
            type: "WARNING",
            link: "/fees", // Deep link to frontend fees page
          },
        });
        createdCount++;
      }

      logger.info(`Successfully created ${createdCount} in-app notifications for fee reminders.`);
    } catch (error) {
      logger.error("Error in fee reminder job:", error);
    }
  });

  logger.info("Fee reminder cron job scheduled (09:00 AM daily)");
}
