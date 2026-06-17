import { Request, Response } from "express"
import { notificationService } from "./service"
import logger from "../../../utils/logger"

export const notificationController = {
    async getNotifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const unreadOnly = req.query.unreadOnly === "true"
            const limit = parseInt(req.query.limit as string) || 30

            const notifications = await notificationService.getByUserId(userId, limit, unreadOnly)
            res.json({ data: notifications })
        } catch (error) {
            logger.error("Error fetching notifications:", error)
            res.status(500).json({ message: "Failed to fetch notifications" })
        }
    },

    async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const count = await notificationService.getUnreadCount(userId)
            res.json({ count })
        } catch (error) {
            logger.error("Error fetching unread count:", error)
            res.status(500).json({ message: "Failed to fetch unread count" })
        }
    },

    async markAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const notificationId = parseInt(req.params.id)

            if (isNaN(notificationId)) {
                return res.status(400).json({ message: "Invalid notification ID" })
            }

            await notificationService.markAsRead(notificationId, userId)
            res.json({ message: "Notification marked as read" })
        } catch (error) {
            logger.error("Error marking notification as read:", error)
            res.status(500).json({ message: "Failed to mark as read" })
        }
    },

    async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            await notificationService.markAllAsRead(userId)
            res.json({ message: "All notifications marked as read" })
        } catch (error) {
            logger.error("Error marking all as read:", error)
            res.status(500).json({ message: "Failed to mark all as read" })
        }
    },
}
