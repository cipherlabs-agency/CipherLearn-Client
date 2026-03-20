import axios from "axios";
import { config } from "../../../config/env.config";
import logger from "../../../utils/logger";
import { log } from "../../../utils/logtail";

/**
 * Instagram Graph API v25.0 (released Feb 18, 2026)
 *
 * Uses "Instagram API with Instagram Login" flow (no Facebook Page required).
 * Scopes updated to `instagram_business_*` format (mandatory since Jan 27, 2025).
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 */

const API_VERSION = "v25.0";
const META_GRAPH_BASE = `https://graph.instagram.com/${API_VERSION}`;
const META_GRAPH_UNVERSIONED = "https://graph.instagram.com"; // token endpoints don't use version
const META_OAUTH_BASE = "https://api.instagram.com/oauth";

// ─────────────────────────────────────────────
// OAuth helpers
// ─────────────────────────────────────────────

/**
 * Build the Meta OAuth authorization URL.
 *
 * Uses "Instagram API with Instagram Login" — no Facebook Page required.
 * Scopes: instagram_business_basic, instagram_business_manage_comments,
 *         instagram_business_manage_messages
 */
export function buildOAuthUrl(state?: string): string {
    const { APP_ID, REDIRECT_URI } = config.INSTAGRAM;

    // New scope format (mandatory since Jan 27, 2025)
    // Old: instagram_basic, instagram_manage_comments, instagram_manage_messages
    // New: instagram_business_basic, instagram_business_manage_comments, instagram_business_manage_messages
    const scopes = [
        "instagram_business_basic",
        "instagram_business_manage_comments",
        "instagram_business_manage_messages",
    ].join(",");

    let url =
        `${META_OAUTH_BASE}/authorize` +
        `?client_id=${APP_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${scopes}` +
        `&response_type=code` +
        `&enable_fb_login=0` +
        `&force_authentication=1`;

    // Pass user ID in state so callback can identify the user
    if (state) {
        url += `&state=${encodeURIComponent(state)}`;
    }

    return url;
}

/**
 * Exchange the short-lived code → short-lived token → long-lived token (60 days).
 *
 * Step 1: POST /oauth/access_token → short-lived token (1 hour)
 * Step 2: GET /access_token?grant_type=ig_exchange_token → long-lived token (60 days)
 *
 * Note: Token endpoints use un-versioned base URL per Meta docs.
 */
export async function exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    userId: string;
    expiresIn: number;
}> {
    const { APP_ID, APP_SECRET, REDIRECT_URI } = config.INSTAGRAM;

    // Step 1 — short-lived token (POST, form-urlencoded)
    const shortRes = await axios.post(
        `${META_OAUTH_BASE}/access_token`,
        new URLSearchParams({
            client_id: APP_ID,
            client_secret: APP_SECRET,
            grant_type: "authorization_code",
            redirect_uri: REDIRECT_URI,
            code,
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const shortToken = shortRes.data.access_token;
    const userId = String(shortRes.data.user_id);

    // Step 2 — exchange for long-lived token (GET)
    const longRes = await axios.get(
        `${META_GRAPH_UNVERSIONED}/access_token`,
        {
            params: {
                grant_type: "ig_exchange_token",
                client_secret: APP_SECRET,
                access_token: shortToken,
            },
        }
    );

    return {
        accessToken: longRes.data.access_token,
        userId,
        expiresIn: longRes.data.expires_in, // ~5184000 seconds = 60 days
    };
}

/**
 * Refresh a long-lived token for another 60 days.
 *
 * Token must be at least 24 hours old and not yet expired.
 * Uses un-versioned endpoint per Meta docs.
 */
export async function refreshLongLivedToken(currentToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
}> {
    const res = await axios.get(
        `${META_GRAPH_UNVERSIONED}/refresh_access_token`,
        {
            params: {
                grant_type: "ig_refresh_token",
                access_token: currentToken,
            },
        }
    );
    return {
        accessToken: res.data.access_token,
        expiresIn: res.data.expires_in,
    };
}

// ─────────────────────────────────────────────
// Graph API v25.0 helpers
// ─────────────────────────────────────────────

/**
 * Fetch the authenticated user's profile.
 *
 * Uses IG User node (v22+ migrated from legacy Instagram User).
 */
export async function fetchIgProfile(accessToken: string) {
    const res = await axios.get(`${META_GRAPH_BASE}/me`, {
        params: {
            fields: "id,user_id,username,profile_picture_url,followers_count,media_count",
            access_token: accessToken,
        },
    });
    const data = res.data;

    // Webhooks send the "canonical" IG User ID which is `user_id` in v22+.
    // `id` is now an app-scoped ID. We must use `user_id` to match webhooks.
    return {
        id: data.user_id || data.id,
        username: data.username,
        profile_picture_url: data.profile_picture_url,
        followers_count: data.followers_count,
        media_count: data.media_count,
    };
}

/**
 * Fetch the user's media (posts, reels, carousels).
 *
 * Uses IG Media node (v22+ migrated — carousels included natively).
 * Uses `like_count` + `comments_count` (still supported in v25).
 */
export async function fetchIgMedia(
    accessToken: string,
    limit = 30,
    after?: string
) {
    const params: Record<string, string> = {
        fields:
            "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
        access_token: accessToken,
        limit: String(limit),
    };
    if (after) params.after = after;

    const res = await axios.get(`${META_GRAPH_BASE}/me/media`, { params });
    return res.data as {
        data: Array<{
            id: string;
            caption?: string;
            media_type: string; // IMAGE | VIDEO | CAROUSEL_ALBUM
            media_url?: string;
            thumbnail_url?: string;
            permalink: string;
            timestamp: string;
            like_count?: number;
            comments_count?: number;
        }>;
        paging?: { cursors?: { after?: string }; next?: string };
    };
}

/**
 * Send a private DM reply to a comment.
 *
 * POST /{ig-user-id}/messages  with  recipient.comment_id
 *
 * Constraints:
 * - 1 private reply per comment within 7 days
 * - Follow-up DMs only if recipient responds (within 24h window)
 * - ~200 DMs/hour rate limit
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
 */
export async function sendPrivateReply(
    igUserId: string,
    commentId: string,
    messageText: string,
    accessToken: string
): Promise<{ recipientId: string; messageId: string }> {
    try {
        const res = await axios.post(
            `${META_GRAPH_BASE}/${igUserId}/messages`,
            {
                recipient: { comment_id: commentId },
                message: { text: messageText },
            },
            {
                params: { access_token: accessToken },
                headers: { "Content-Type": "application/json" },
            }
        );
        return {
            recipientId: res.data.recipient_id,
            messageId: res.data.message_id,
        };
    } catch (err: any) {
      log("error", "dashboard.instagram.post failed", { err: err instanceof Error ? err.message : String(err) });
        const errorMsg =
            err.response?.data?.error?.message || err.message || "Unknown error";
        throw new Error(errorMsg);
    }
}

/**
 * Send a standard text DM directly to a user's ID (requires open 24h window).
 */
export async function sendDirectTextDm(
    igUserId: string,
    recipientId: string,
    messageText: string,
    accessToken: string
): Promise<{ recipientId: string; messageId: string }> {
    try {
        const res = await axios.post(
            `${META_GRAPH_BASE}/${igUserId}/messages`,
            {
                recipient: { id: recipientId },
                message: { text: messageText },
            },
            {
                params: { access_token: accessToken },
                headers: { "Content-Type": "application/json" },
            }
        );
        return {
            recipientId: res.data.recipient_id,
            messageId: res.data.message_id,
        };
    } catch (err: any) {
      log("error", "dashboard.instagram.post failed", { err: err instanceof Error ? err.message : String(err) });
        const errorMsg =
            err.response?.data?.error?.message || err.message || "Unknown error";
        throw new Error(errorMsg);
    }
}

/**
 * Send a DM with a Generic Template (text + link buttons).
 *
 * Instagram supports up to 3 buttons per generic template element.
 * Each button can be a URL button that opens an in-app browser.
 *
 * POST /{ig-user-id}/messages
 */
export async function sendGenericTemplate(
    igUserId: string,
    recipientId: string, // Changed from commentId to recipientId
    title: string,
    buttons: Array<{ title: string; url: string }>,
    accessToken: string
): Promise<{ recipientId: string; messageId: string }> {
    try {
        const res = await axios.post(
            `${META_GRAPH_BASE}/${igUserId}/messages`,
            {
                recipient: { id: recipientId }, // Changed from comment_id
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: [
                                {
                                    title,
                                    buttons: buttons.slice(0, 3).map((b) => ({
                                        type: "web_url",
                                        url: b.url,
                                        title: b.title,
                                    })),
                                },
                            ],
                        },
                    },
                },
            },
            {
                params: { access_token: accessToken },
                headers: { "Content-Type": "application/json" },
            }
        );
        return {
            recipientId: res.data.recipient_id,
            messageId: res.data.message_id,
        };
    } catch (err: any) {
      log("error", "dashboard.instagram.slice failed", { err: err instanceof Error ? err.message : String(err) });
        const errorMsg =
            err.response?.data?.error?.message || err.message || "Unknown error";
        throw new Error(errorMsg);
    }
}

/**
 * Unified DM sender — dispatches to text or template based on rule config.
 * 
 * Note: Instagram Graph API silently drops `template` attachments when sending
 * a Private Reply via `comment_id`. Thus, for Rich Templates, we MUST:
 * 1. Send a standard text Private Reply via `comment_id`.
 * 2. Immediately send the actual Template with buttons to the user's ID.
 */
export async function sendDm(
    igUserId: string,
    commentId: string,
    commenterId: string,
    dmMessage: string,
    dmType: "TEXT" | "TEMPLATE",
    dmButtons: Array<{ title: string; url: string }> | null,
    accessToken: string
): Promise<{ recipientId: string; messageId: string }> {
    if (dmType === "TEMPLATE" && dmButtons && dmButtons.length > 0) {
        try {
            // Attempt to send the rich template directly to their ID.
            // This will only succeed if the 24h messaging window is already open.
            return await sendGenericTemplate(igUserId, commenterId, dmMessage, dmButtons, accessToken);
        } catch (err: any) {
          log("error", "dashboard.instagram.sendGenericTemplate failed", { err: err instanceof Error ? err.message : String(err) });
            logger.warn(`Template DM failed for ${commenterId}. Falling back to text-only Private Reply.`);

            // Build the fallback string appending button URLs
            let fallbackText = dmMessage + "\n\n";
            dmButtons.forEach(btn => {
                fallbackText += `🔗 ${btn.title}: ${btn.url}\n`;
            });

            // Fast fallback: send ONE standard text reply via their comment_id.
            // This consumes our 1 allowed reply for this comment.
            return sendPrivateReply(igUserId, commentId, fallbackText.trim(), accessToken);
        }
    }

    // Standard Text DM via comment_id
    return sendPrivateReply(igUserId, commentId, dmMessage, accessToken);
}

/**
 * Sends a "Gate" DM to a user who hasn't followed yet.
 * This sends a Template message with a Postback Button.
 * When the user clicks the button, Meta sends a `messaging_postbacks` webhook to our server.
 */
export async function sendFollowGateDM(
    igUserId: string,
    commentId: string,
    commenterId: string,
    unfollowedMessage: string,
    ruleId: number,
    accessToken: string
): Promise<{ recipientId: string; messageId: string }> {
    try {
        // Attempt to send the postback template directly to their ID.
        // This will only succeed if the user already has an open 24h messaging window.
        const res = await axios.post(
            `${META_GRAPH_BASE}/${igUserId}/messages`,
            {
                recipient: { id: commenterId },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: [
                                {
                                    title: unfollowedMessage || "Please follow our page to get the link!",
                                    buttons: [
                                        {
                                            type: "postback",
                                            title: "Yes, I followed! ✅",
                                            payload: `VERIFY_FOLLOW_${ruleId}`
                                        }
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
            {
                params: { access_token: accessToken },
                headers: { "Content-Type": "application/json" },
            }
        );
        return {
            recipientId: res.data.recipient_id,
            messageId: res.data.message_id,
        };
    } catch (err: any) {
      log("error", "dashboard.instagram.post failed", { err: err instanceof Error ? err.message : String(err) });
        // FALLBACK: If they don't have an open window, it throws "outside allowed window".
        // We fallback to ONE standard Private Reply via comment_id.
        // We cannot use postback buttons in plain text, so we ask them to reply with the keyword to open the window.
        const fallbackText = `${unfollowedMessage || "Please follow our page to get the link!"}\n\nOnce you follow us, reply to this message with the exact same keyword you just commented to get your link!`;
        return sendPrivateReply(igUserId, commentId, fallbackText, accessToken);
    }
}

