import { prisma } from "../../../config/db.config";
import logger from "../../../utils/logger";
import {
    buildOAuthUrl,
    exchangeCodeForToken,
    fetchIgProfile,
    fetchIgMedia,
    sendDm,
    refreshLongLivedToken,
} from "./instagram.utils";
import { log } from "../../../utils/logtail";

// ─── Types ────────────────────────────────────

export interface CreateRuleInput {
    mediaId: string;
    mediaUrl?: string;
    mediaCaption?: string;
    mediaType?: string;
    triggerKeyword: string;
    dmMessage: string;
    dmType?: "TEXT" | "TEMPLATE";
    dmButtons?: Array<{ title: string; url: string }>;
    isFollowGated?: boolean;
    unfollowedMessage?: string;
}

export interface UpdateRuleInput {
    triggerKeyword?: string;
    dmMessage?: string;
    dmType?: "TEXT" | "TEMPLATE";
    dmButtons?: Array<{ title: string; url: string }>;
    status?: "ACTIVE" | "PAUSED";
    isFollowGated?: boolean;
    unfollowedMessage?: string;
}

// ─── Service ──────────────────────────────────

export class InstagramService {
    /**
     * Returns the Meta OAuth authorization URL.
     */
    getOAuthUrl(state?: string): string {
        return buildOAuthUrl(state);
    }

    /**
     * Handle the OAuth callback — exchange code for token, fetch profile,
     * and upsert the InstagramAccount record.
     *
     * IMPORTANT: We use profile.id (from GET /me) as igUserId, NOT the
     * userId from the token exchange. They can be different, and webhooks
     * use the /me ID.
     */
    async handleCallback(code: string, userId: number) {
        // Exchange code for long-lived token
        const { accessToken, expiresIn } =
            await exchangeCodeForToken(code);

        // Fetch profile info — profile.id is the CORRECT IG user ID
        // that matches what Meta sends in webhook payloads
        const profile = await fetchIgProfile(accessToken);
        const igUserId = profile.id; // Use this, NOT the OAuth userId

        // Calculate token expiry
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

        // Upsert — a user can only have one connected IG account
        const account = await prisma.instagramAccount.upsert({
            where: { userId },
            create: {
                userId,
                igUserId,
                username: profile.username,
                profilePictureUrl: profile.profile_picture_url || null,
                accessToken,
                tokenExpiresAt,
                followersCount: profile.followers_count || null,
                mediaCount: profile.media_count || null,
            },
            update: {
                igUserId,
                username: profile.username,
                profilePictureUrl: profile.profile_picture_url || null,
                accessToken,
                tokenExpiresAt,
                followersCount: profile.followers_count || null,
                mediaCount: profile.media_count || null,
            },
        });

        return account;
    }

    /**
     * Get the connected Instagram account for a user.
     */
    async getAccount(userId: number) {
        const account = await prisma.instagramAccount.findUnique({
            where: { userId },
            include: {
                automationRules: {
                    orderBy: { createdAt: "desc" },
                    select: { id: true, mediaId: true, triggerKeyword: true, status: true },
                },
            },
        });
        if (account) {
            // Don't expose raw token to frontend
            return { ...account, accessToken: "***" };
        }
        return null;
    }

    /**
     * Disconnect — delete the IG account (cascades to rules & logs).
     */
    async disconnect(userId: number) {
        await prisma.instagramAccount.delete({ where: { userId } });
        return { success: true };
    }

    /**
     * Fetch posts/reels from the user's connected IG account.
     */
    async fetchMedia(userId: number, after?: string) {
        const account = await prisma.instagramAccount.findUnique({
            where: { userId },
        });
        if (!account) throw new Error("Instagram account not connected");

        // Auto-refresh token if expiring within 7 days
        if (
            account.tokenExpiresAt &&
            account.tokenExpiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
        ) {
            try {
                const refreshed = await refreshLongLivedToken(account.accessToken);
                await prisma.instagramAccount.update({
                    where: { userId },
                    data: {
                        accessToken: refreshed.accessToken,
                        tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
                    },
                });
                account.accessToken = refreshed.accessToken;
            } catch (err) {
              log("error", "dashboard.instagram.Date failed", { err: err instanceof Error ? err.message : String(err) });
                logger.warn("Token refresh failed, using existing token");
            }
        }

        return fetchIgMedia(account.accessToken, 30, after);
    }

    // ─── Automation Rules CRUD ──────────────────

    async getRules(userId: number) {
        const account = await prisma.instagramAccount.findUnique({
            where: { userId },
        });
        if (!account) throw new Error("Instagram account not connected");

        return prisma.automationRule.findMany({
            where: { instagramAccountId: account.id },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { logs: true } },
            },
        });
    }

    async getRulesForMedia(userId: number, mediaId: string) {
        const account = await prisma.instagramAccount.findUnique({
            where: { userId },
        });
        if (!account) throw new Error("Instagram account not connected");

        return prisma.automationRule.findMany({
            where: { instagramAccountId: account.id, mediaId },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { logs: true } },
            },
        });
    }

    async createRule(userId: number, input: CreateRuleInput) {
        const account = await prisma.instagramAccount.findUnique({
            where: { userId },
        });
        if (!account) throw new Error("Instagram account not connected");

        // Normalize keyword to uppercase
        const keyword = input.triggerKeyword.trim().toUpperCase();

        // Check for duplicate keyword on same media
        const existing = await prisma.automationRule.findFirst({
            where: {
                instagramAccountId: account.id,
                mediaId: input.mediaId,
                triggerKeyword: keyword,
            },
        });
        if (existing)
            throw new Error(
                `A rule with keyword "${keyword}" already exists for this post`
            );

        return prisma.automationRule.create({
            data: {
                instagramAccountId: account.id,
                mediaId: input.mediaId,
                mediaUrl: input.mediaUrl || null,
                mediaCaption: input.mediaCaption || null,
                mediaType: input.mediaType || null,
                triggerKeyword: keyword,
                dmMessage: input.dmMessage,
                dmType: input.dmType || "TEXT",
                dmButtons: input.dmButtons || undefined,
                isFollowGated: input.isFollowGated || false,
                unfollowedMessage: input.unfollowedMessage || null,
            },
        });
    }

    async updateRule(userId: number, ruleId: number, input: UpdateRuleInput) {
        // Verify ownership
        const account = await prisma.instagramAccount.findUnique({
            where: { userId },
        });
        if (!account) throw new Error("Instagram account not connected");

        const rule = await prisma.automationRule.findFirst({
            where: { id: ruleId, instagramAccountId: account.id },
        });
        if (!rule) throw new Error("Rule not found");

        return prisma.automationRule.update({
            where: { id: ruleId },
            data: {
                triggerKeyword: input.triggerKeyword
                    ? input.triggerKeyword.trim().toUpperCase()
                    : undefined,
                dmMessage: input.dmMessage,
                dmType: input.dmType,
                dmButtons: input.dmButtons !== undefined ? input.dmButtons : undefined,
                status: input.status,
                isFollowGated: input.isFollowGated !== undefined ? input.isFollowGated : undefined,
                unfollowedMessage: input.unfollowedMessage !== undefined ? input.unfollowedMessage : undefined,
            },
        });
    }

    async deleteRule(userId: number, ruleId: number) {
        const account = await prisma.instagramAccount.findUnique({
            where: { userId },
        });
        if (!account) throw new Error("Instagram account not connected");

        const rule = await prisma.automationRule.findFirst({
            where: { id: ruleId, instagramAccountId: account.id },
        });
        if (!rule) throw new Error("Rule not found");

        await prisma.automationRule.delete({ where: { id: ruleId } });
        return { success: true };
    }

    async getRuleLogs(userId: number, ruleId: number, page = 1, limit = 20) {
        const account = await prisma.instagramAccount.findUnique({
            where: { userId },
        });
        if (!account) throw new Error("Instagram account not connected");

        const rule = await prisma.automationRule.findFirst({
            where: { id: ruleId, instagramAccountId: account.id },
        });
        if (!rule) throw new Error("Rule not found");

        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma.automationLog.findMany({
                where: { ruleId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.automationLog.count({ where: { ruleId } }),
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }



    // ─── Analytics ───────────────────────────────

    async getAnalytics(userId: number) {
        const account = await prisma.instagramAccount.findUnique({
            where: { userId },
        });
        if (!account) throw new Error("Instagram account not connected");

        const [totalRules, activeRules, totalDmsSent, recentLogs, dmsByStatus] = await Promise.all([
            prisma.automationRule.count({ where: { instagramAccountId: account.id } }),
            prisma.automationRule.count({ where: { instagramAccountId: account.id, status: "ACTIVE" } }),
            prisma.automationRule.aggregate({
                where: { instagramAccountId: account.id },
                _sum: { dmsSentCount: true },
            }),
            prisma.automationLog.findMany({
                where: { rule: { instagramAccountId: account.id } },
                orderBy: { createdAt: "desc" },
                take: 50,
                include: { rule: { select: { triggerKeyword: true, mediaId: true } } },
            }),
            prisma.automationLog.groupBy({
                by: ["dmStatus"],
                where: { rule: { instagramAccountId: account.id } },
                _count: { id: true },
            }),
        ]);

        const postsMonitored = await prisma.automationRule.findMany({
            where: { instagramAccountId: account.id },
            select: { mediaId: true },
            distinct: ["mediaId"],
        });

        const statusMap: Record<string, number> = {};
        dmsByStatus.forEach((s) => {
            statusMap[s.dmStatus] = s._count.id;
        });

        const totalLogs = (statusMap.SENT || 0) + (statusMap.FAILED || 0) + (statusMap.RATE_LIMITED || 0);
        const successRate = totalLogs > 0 ? Math.round(((statusMap.SENT || 0) / totalLogs) * 100) : 100;

        return {
            totalDmsSent: totalDmsSent._sum.dmsSentCount || 0,
            activeRules,
            totalRules,
            postsMonitored: postsMonitored.length,
            successRate,
            dmsByStatus: statusMap,
            recentActivity: recentLogs,
        };
    }

    async getAllLogs(userId: number, page = 1, limit = 30, status?: string) {
        const account = await prisma.instagramAccount.findUnique({
            where: { userId },
        });
        if (!account) throw new Error("Instagram account not connected");

        const where: any = { rule: { instagramAccountId: account.id } };
        if (status) where.dmStatus = status;

        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma.automationLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: { rule: { select: { triggerKeyword: true, mediaId: true, mediaUrl: true } } },
            }),
            prisma.automationLog.count({ where }),
        ]);

        return {
            logs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}

export const instagramService = new InstagramService();
