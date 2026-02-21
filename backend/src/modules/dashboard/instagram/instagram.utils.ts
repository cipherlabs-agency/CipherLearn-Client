import axios from "axios";
import { config } from "../../../config/env.config";
import logger from "../../../utils/logger";

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
            fields: "id,username,profile_picture_url,followers_count,media_count",
            access_token: accessToken,
        },
    });
    return res.data as {
        id: string;
        username: string;
        profile_picture_url?: string;
        followers_count?: number;
        media_count?: number;
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
        const errorMsg =
            err.response?.data?.error?.message || err.message || "Unknown error";
        logger.error(`Instagram DM send failed: ${errorMsg}`);
        throw new Error(errorMsg);
    }
}
