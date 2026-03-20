import { prisma } from "../../../config/db.config";
import logger from "../../../utils/logger";
import { sendDm, sendFollowGateDM, sendGenericTemplate, sendDirectTextDm } from "./instagram.utils";
import { log } from "../../../utils/logtail";

/**
 * The Automation Engine is responsible for processing incoming triggers (webhooks)
 * from Meta and executing the corresponding rules (e.g. sending a DM).
 * 
 * Future scalability:
 * - processStoryReplyWebhook
 * - processDmKeywordWebhook
 */
export class AutomationEngine {

    /**
     * Entry point for comment webhooks.
     * Matches the comment text against active rules for the specific media and sends the configured DM.
     */
    async processCommentWebhook(payload: {
        igUserId: string;
        mediaId: string;
        commentId: string;
        commentText: string;
        commenterId: string;
        commenterUsername?: string;
    }) {
        const { igUserId, mediaId, commentId, commentText, commenterId, commenterUsername } = payload;

        // Find the connected account
        const account = await prisma.instagramAccount.findUnique({
            where: { igUserId },
        });

        if (!account) {
            logger.warn(`AutomationEngine: No account found for IG user ${igUserId}`);
            return;
        }

        // Find matching active rules for this media
        const rules = await prisma.automationRule.findMany({
            where: {
                instagramAccountId: account.id,
                mediaId,
                status: "ACTIVE",
            },
        });

        if (rules.length === 0) return;

        const upperComment = commentText.trim().toUpperCase();

        for (const rule of rules) {
            // Check if comment contains the trigger keyword
            if (upperComment.includes(rule.triggerKeyword.toUpperCase())) {
                try {
                    const buttons = rule.dmButtons as Array<{ title: string; url: string }> | null;

                    // PHASE 3: FOLLOW GATING LOGIC
                    // Since Instagram Graph API doesn't provide a direct way to verify if User A follows User B
                    // without complex looping, we check if the rule is follow-gated and send a Postback DM first.
                    // Later, when they click "Yes, I followed", we will verify it.
                    if (rule.isFollowGated) {
                        logger.info(`AutomationEngine: Rule #${rule.id} is follow-gated. Sending gate DM to ${commenterUsername || commenterId}.`);
                        await sendFollowGateDM(
                            igUserId,
                            commentId,
                            commenterId,
                            rule.unfollowedMessage || "Please follow our page to get the link!",
                            rule.id,
                            account.accessToken
                        );
                        // We still log this as SENT, but it's a GATE sent, not the reward.
                        await prisma.automationLog.create({
                            data: {
                                ruleId: rule.id,
                                commenterId,
                                commenterUsername: commenterUsername || null,
                                commentText,
                                dmStatus: "SENT", // We sent the gate
                            },
                        });
                        continue; // Skip sending the immediate reward template
                    }

                    // STANDARD LOGIC: Execute the action (Send DM)
                    await sendDm(
                        igUserId,
                        commentId,
                        commenterId,
                        rule.dmMessage,
                        rule.dmType as "TEXT" | "TEMPLATE",
                        buttons,
                        account.accessToken
                    );

                    // Log Success
                    await prisma.automationLog.create({
                        data: {
                            ruleId: rule.id,
                            commenterId,
                            commenterUsername: commenterUsername || null,
                            commentText,
                            dmStatus: "SENT",
                        },
                    });

                    // Update Rule Stats
                    await prisma.automationRule.update({
                        where: { id: rule.id },
                        data: {
                            dmsSentCount: { increment: 1 },
                            lastTriggeredAt: new Date(),
                        },
                    });

                    logger.info(`AutomationEngine: DM sent to ${commenterUsername || commenterId} via rule #${rule.id}`);
                } catch (err: any) {
                  log("error", "dashboard.instagram.info failed", { err: err instanceof Error ? err.message : String(err) });
                    const isRateLimit = err.message?.includes("rate") || err.message?.includes("limit");

                    await prisma.automationLog.create({
                        data: {
                            ruleId: rule.id,
                            commenterId,
                            commenterUsername: commenterUsername || null,
                            commentText,
                            dmStatus: isRateLimit ? "RATE_LIMITED" : "FAILED",
                            errorMessage: err.message || "Unknown error",
                        },
                    });

                    logger.error(`AutomationEngine: DM failed for rule #${rule.id}: ${err.message}`);
                }
            }
        }
    }

    /**
     * Entry point for direct message (DM) webhooks.
     * This handles replies to our Private Replies, such as when users reply "LINK"
     * to bypass a Follow Gate when their DM window was closed.
     */
    async processMessageWebhook(data: {
        igUserId: string;
        senderId: string;
        messageText: string;
    }) {
        const { igUserId, senderId, messageText } = data;

        const account = await prisma.instagramAccount.findUnique({
            where: { igUserId },
        });

        if (!account) return;

        const upperMessage = messageText.trim().toUpperCase();

        // Get all active rules for this account
        const rules = await prisma.automationRule.findMany({
            where: { instagramAccountId: account.id, status: "ACTIVE" },
            orderBy: { createdAt: "desc" }
        });

        // Find the first rule where the message contains the trigger keyword
        const matchedRule = rules.find(r => upperMessage.includes(r.triggerKeyword.toUpperCase()));

        if (!matchedRule) return;

        try {
            logger.info(`AutomationEngine: Delivering DM via message reply for rule #${matchedRule.id} to ${senderId}.`);

            if (matchedRule.dmType === "TEMPLATE" && matchedRule.dmButtons) {
                const buttons = matchedRule.dmButtons as Array<{ title: string; url: string }>;
                if (buttons.length > 0) {
                    await sendGenericTemplate(
                        igUserId,
                        senderId,
                        matchedRule.dmMessage,
                        buttons,
                        account.accessToken
                    );
                } else {
                    await sendDirectTextDm(igUserId, senderId, matchedRule.dmMessage, account.accessToken);
                }
            } else {
                await sendDirectTextDm(igUserId, senderId, matchedRule.dmMessage, account.accessToken);
            }

            await prisma.automationLog.create({
                data: {
                    ruleId: matchedRule.id,
                    commenterId: senderId,
                    commenterUsername: "DM Responder",
                    commentText: messageText,
                    dmStatus: "SENT",
                },
            });

            await prisma.automationRule.update({
                where: { id: matchedRule.id },
                data: {
                    dmsSentCount: { increment: 1 },
                    lastTriggeredAt: new Date(),
                },
            });

        } catch (err: any) {
          log("error", "dashboard.instagram.Date failed", { err: err instanceof Error ? err.message : String(err) });
            const isRateLimit = err.message?.includes("rate") || err.message?.includes("limit");
            logger.error(`AutomationEngine: DM delivery via message reply failed for rule #${matchedRule.id}: ${err.message}`);

            await prisma.automationLog.create({
                data: {
                    ruleId: matchedRule.id,
                    commenterId: senderId,
                    commenterUsername: "DM Responder",
                    commentText: messageText,
                    dmStatus: isRateLimit ? "RATE_LIMITED" : "FAILED",
                    errorMessage: err.message || "Unknown error",
                },
            });
        }
    }

    /**
     * Entry point for postback webhooks (button clicks).
     */
    async processPostbackWebhook(data: {
        igUserId: string;
        senderId: string;
        payload: string;
    }) {
        const { igUserId, senderId, payload } = data;

        if (payload.startsWith("VERIFY_FOLLOW_")) {
            const ruleIdStr = payload.replace("VERIFY_FOLLOW_", "");
            const ruleId = parseInt(ruleIdStr, 10);

            if (isNaN(ruleId)) return;

            // Fetch the rule and account
            const rule = await prisma.automationRule.findUnique({
                where: { id: ruleId },
                include: { instagramAccount: true }
            });

            if (!rule || !rule.instagramAccount || rule.instagramAccount.igUserId !== igUserId) {
                logger.warn(`AutomationEngine: Invalid follow postback for rule #${ruleId}. Data mismatch.`);
                return;
            }

            // At this point, the user clicked "Yes, I followed".
            // Since we can't reliably API-check arbitrary users following our account in real-time without
            // OAuth, we operate on the honor system (which is standard practice for this IG workaround).
            // We now deliver the actual gated reward to `senderId`.

            try {
                logger.info(`AutomationEngine: Delivering gated reward for rule #${rule.id} to ${senderId}.`);

                if (rule.dmType === "TEMPLATE" && rule.dmButtons) {
                    const buttons = rule.dmButtons as Array<{ title: string; url: string }>;
                    if (buttons.length > 0) {
                        await sendGenericTemplate(
                            igUserId,
                            senderId, // Postbacks are 1:1 messaging, so we use their direct ID
                            rule.dmMessage,
                            buttons,
                            rule.instagramAccount.accessToken
                        );
                    } else {
                        await sendDirectTextDm(igUserId, senderId, rule.dmMessage, rule.instagramAccount.accessToken);
                    }
                } else {
                    await sendDirectTextDm(igUserId, senderId, rule.dmMessage, rule.instagramAccount.accessToken);
                }

                // Log the final reward success
                await prisma.automationLog.create({
                    data: {
                        ruleId: rule.id,
                        commenterId: senderId,
                        commenterUsername: "Verified Follower", // We don't get username in standard msg webhooks
                        commentText: "[Button Click: Follow Verified]",
                        dmStatus: "SENT",
                    },
                });

                // Update stats
                await prisma.automationRule.update({
                    where: { id: rule.id },
                    data: {
                        dmsSentCount: { increment: 1 },
                        lastTriggeredAt: new Date(),
                    },
                });

            } catch (err: any) {
              log("error", "dashboard.instagram.Date failed", { err: err instanceof Error ? err.message : String(err) });
                const isRateLimit = err.message?.includes("rate") || err.message?.includes("limit");
                logger.error(`AutomationEngine: Gated reward failed for rule #${rule.id}: ${err.message}`);

                await prisma.automationLog.create({
                    data: {
                        ruleId: rule.id,
                        commenterId: senderId,
                        commenterUsername: "Verified Follower",
                        commentText: "[Button Click: Follow Verified]",
                        dmStatus: isRateLimit ? "RATE_LIMITED" : "FAILED",
                        errorMessage: err.message || "Unknown error",
                    },
                });
            }
        }
    }
}

export const automationEngine = new AutomationEngine();
