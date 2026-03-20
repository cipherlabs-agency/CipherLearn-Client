import { Request, Response } from "express";
import { instagramService } from "./service";
import { automationEngine } from "./automation.engine";
import { config } from "../../../config/env.config";
import logger from "../../../utils/logger";
import { log } from "../../../utils/logtail";

export class InstagramController {
    /**
     * GET /connect — returns the Meta OAuth URL with user ID encoded in state
     */
    async connect(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            // Pass user ID as state so the callback knows which user to associate
            const url = instagramService.getOAuthUrl(String(userId));
            res.json({ success: true, data: { url } });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message =
                error instanceof Error ? error.message : "Failed to generate OAuth URL";
            res.status(500).json({ success: false, message });
        }
    }

    /**
     * GET /callback?code=xxx&state=userId — Instagram redirects here after OAuth.
     * This route is PUBLIC (no auth middleware) because Instagram sends the
     * user here via browser redirect — there's no JWT in the request.
     * We get the user ID from the `state` query parameter instead.
     */
    async callback(req: Request, res: Response): Promise<void> {
        const clientUrl = config.APP.CLIENT_URL;
        try {
            const { code, state } = req.query;
            if (!code || typeof code !== "string") {
                res.redirect(`${clientUrl}/instagram?error=Missing+OAuth+code`);
                return;
            }

            // Get user ID from state parameter (set during /connect)
            const userId = state ? parseInt(state as string, 10) : null;
            if (!userId || isNaN(userId)) {
                res.redirect(`${clientUrl}/instagram?error=Invalid+session`);
                return;
            }

            await instagramService.handleCallback(code, userId);

            // Redirect back to the frontend Instagram page
            res.redirect(`${clientUrl}/instagram?connected=true`);
        } catch (error) {
          log("error", "dashboard.instagram.redirect failed", { err: error instanceof Error ? error.message : String(error) });
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to connect Instagram account";
            logger.error(`Instagram callback error: ${message}`);

            res.redirect(
                `${clientUrl}/instagram?error=${encodeURIComponent(message)}`
            );
        }
    }

    /**
     * POST /disconnect
     */
    async disconnect(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            await instagramService.disconnect(userId);
            res.json({
                success: true,
                message: "Instagram account disconnected",
            });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message =
                error instanceof Error ? error.message : "Failed to disconnect";
            res.status(500).json({ success: false, message });
        }
    }

    /**
     * GET /account — get connected account info
     */
    async getAccount(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const account = await instagramService.getAccount(userId);
            res.json({ success: true, data: account });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message =
                error instanceof Error ? error.message : "Failed to fetch account";
            res.status(500).json({ success: false, message });
        }
    }

    /**
     * GET /media — fetch posts/reels
     */
    async getMedia(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const after = req.query.after as string | undefined;
            const media = await instagramService.fetchMedia(userId, after);
            res.json({ success: true, data: media });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message =
                error instanceof Error ? error.message : "Failed to fetch media";
            res.status(500).json({ success: false, message });
        }
    }

    /**
     * GET /rules
     */
    async getRules(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const { mediaId } = req.query;
            const rules = mediaId
                ? await instagramService.getRulesForMedia(userId, mediaId as string)
                : await instagramService.getRules(userId);
            res.json({ success: true, data: rules });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message =
                error instanceof Error ? error.message : "Failed to fetch rules";
            res.status(500).json({ success: false, message });
        }
    }

    /**
     * POST /rules — create a new automation rule
     */
    async createRule(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const { mediaId, mediaUrl, mediaCaption, mediaType, triggerKeyword, dmMessage, dmType, dmButtons } =
                req.body;

            if (!mediaId || !triggerKeyword || !dmMessage) {
                res.status(400).json({
                    success: false,
                    message: "mediaId, triggerKeyword, and dmMessage are required",
                });
                return;
            }

            const rule = await instagramService.createRule(userId, {
                mediaId,
                mediaUrl,
                mediaCaption,
                mediaType,
                triggerKeyword,
                dmMessage,
                dmType,
                dmButtons,
            });

            res.status(201).json({
                success: true,
                message: "Automation rule created",
                data: rule,
            });
        } catch (error) {
          log("error", "dashboard.instagram.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message =
                error instanceof Error ? error.message : "Failed to create rule";
            res.status(500).json({ success: false, message });
        }
    }

    /**
     * PUT /rules/:id
     */
    async updateRule(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const ruleId = parseInt(req.params.id, 10);
            const { triggerKeyword, dmMessage, status, dmType, dmButtons } = req.body;

            const rule = await instagramService.updateRule(userId, ruleId, {
                triggerKeyword,
                dmMessage,
                status,
                dmType,
                dmButtons,
            });

            res.json({
                success: true,
                message: "Rule updated",
                data: rule,
            });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error) });
            const message =
                error instanceof Error ? error.message : "Failed to update rule";
            res.status(500).json({ success: false, message });
        }
    }

    /**
     * DELETE /rules/:id
     */
    async deleteRule(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const ruleId = parseInt(req.params.id, 10);
            await instagramService.deleteRule(userId, ruleId);
            res.json({ success: true, message: "Rule deleted" });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message =
                error instanceof Error ? error.message : "Failed to delete rule";
            res.status(500).json({ success: false, message });
        }
    }

    /**
     * GET /rules/:id/logs
     */
    async getRuleLogs(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const ruleId = parseInt(req.params.id, 10);
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await instagramService.getRuleLogs(
                userId,
                ruleId,
                page,
                limit
            );
            res.json({
                success: true,
                data: result.logs,
                pagination: result.pagination,
            });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message =
                error instanceof Error ? error.message : "Failed to fetch logs";
            res.status(500).json({ success: false, message });
        }
    }

    /**
     * GET /analytics — dashboard stats
     */
    async getAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const analytics = await instagramService.getAnalytics(userId);
            res.json({ success: true, data: analytics });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message =
                error instanceof Error ? error.message : "Failed to fetch analytics";
            res.status(500).json({ success: false, message });
        }
    }

    /**
     * GET /logs — global activity log across all rules
     */
    async getAllLogs(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 30;
            const status = req.query.status as string | undefined;

            const result = await instagramService.getAllLogs(userId, page, limit, status);
            res.json({
                success: true,
                data: result.logs,
                pagination: result.pagination,
            });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message =
                error instanceof Error ? error.message : "Failed to fetch logs";
            res.status(500).json({ success: false, message });
        }
    }

    // ─── Webhook Endpoints (called by Meta) ─────

    /**
     * GET /webhook — Meta verification challenge
     */
    async webhookVerify(req: Request, res: Response): Promise<void> {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (
            mode === "subscribe" &&
            token === config.INSTAGRAM.WEBHOOK_VERIFY_TOKEN
        ) {
            logger.info("Instagram webhook verified successfully");
            res.status(200).send(challenge);
        } else {
            logger.warn("Instagram webhook verification failed");
            res.status(403).send("Forbidden");
        }
    }

    /**
     * POST /webhook — receive comment events from Meta
     */
    async webhookHandler(req: Request, res: Response): Promise<void> {
        // Always respond 200 immediately (Meta requires fast response)
        res.status(200).send("EVENT_RECEIVED");

        try {
            const body = req.body;

            // ── DEBUG: log everything that arrives ──
            logger.info(`[WEBHOOK RAW] ${JSON.stringify(body)}`);

            // Parse Meta webhook payload
            if (body.object !== "instagram") {
                logger.warn(`[WEBHOOK] Ignored: object=${body.object}`);
                return;
            }

            for (const entry of body.entry || []) {
                const igUserId = entry.id;
                logger.info(`[WEBHOOK] Entry for IG user: ${igUserId}, changes: ${JSON.stringify(entry.changes?.length || 0)}`);

                // 1. Process Comments
                for (const change of entry.changes || []) {
                    logger.info(`[WEBHOOK] Change field: ${change.field}, value: ${JSON.stringify(change.value)}`);

                    if (change.field === "comments") {
                        const value = change.value;
                        // value: { id, media: { id }, text, from: { id, username }, ... }
                        await automationEngine.processCommentWebhook({
                            igUserId,
                            mediaId: value.media?.id,
                            commentId: value.id,
                            commentText: value.text || "",
                            commenterId: value.from?.id,
                            commenterUsername: value.from?.username,
                        });
                    }
                }

                // 2. Process Messages & Postbacks
                for (const msg of entry.messaging || []) {
                    // Ignore our own echo messages
                    if (msg.message?.is_echo) continue;

                    // If it's a postback (button click)
                    if (msg.postback && msg.postback.payload) {
                        logger.info(`[WEBHOOK] Received postback: ${msg.postback.payload} from ${msg.sender?.id}`);
                        await automationEngine.processPostbackWebhook({
                            igUserId,
                            senderId: msg.sender?.id,
                            payload: msg.postback.payload
                        });
                    }
                    // If it's a standard text message (e.g. they replied to our Private Reply with the keyword)
                    else if (msg.message && msg.message.text) {
                        logger.info(`[WEBHOOK] Received DM: "${msg.message.text}" from ${msg.sender?.id}`);
                        await automationEngine.processMessageWebhook({
                            igUserId,
                            senderId: msg.sender?.id,
                            messageText: msg.message.text
                        });
                    }
                }
            }
        } catch (error) {
          log("error", "dashboard.instagram.processMessageWebhook failed", { err: error instanceof Error ? error.message : String(error) });
            logger.error("Webhook processing error:", error);
        }
    }

    /**
     * POST /webhook/test — DEV ONLY: Simulate a comment webhook
     * Body: { commentText: "LINK", commenterUsername: "test_user" }
     */
    async webhookTest(req: Request, res: Response): Promise<void> {
        if (process.env.NODE_ENV === "production") {
            res.status(404).send("Not found");
            return;
        }
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const { commentText, commenterUsername } = req.body;
            if (!commentText) {
                res.status(400).json({ success: false, message: "commentText is required" });
                return;
            }

            // Get user's IG account
            const account = await instagramService.getAccount(userId);
            if (!account) {
                res.status(400).json({ success: false, message: "No Instagram account connected" });
                return;
            }

            // Get the first active rule to find a mediaId
            const rules = await instagramService.getRules(userId);
            const activeRule = rules.find((r: any) => r.status === "ACTIVE");
            if (!activeRule) {
                res.status(400).json({ success: false, message: "No active rules found" });
                return;
            }

            logger.info(`[TEST] Simulating comment webhook: "${commentText}" by @${commenterUsername || "test_user"}`);

            // Simulate the webhook processing
            await automationEngine.processCommentWebhook({
                igUserId: account.igUserId || "",
                mediaId: activeRule.mediaId,
                commentId: `test_comment_${Date.now()}`,
                commentText,
                commenterId: `test_${Date.now()}`,
                commenterUsername: commenterUsername || "test_user",
            });

            res.json({
                success: true,
                message: `Webhook simulated for media ${activeRule.mediaId} with keyword "${commentText}". Check your DM logs.`,
            });
        } catch (error) {
          log("error", "dashboard.instagram.json failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
            const message = error instanceof Error ? error.message : "Test failed";
            res.status(500).json({ success: false, message });
        }
    }
}

export const instagramController = new InstagramController();
