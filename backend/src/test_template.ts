import { sendGenericTemplate } from "./modules/dashboard/instagram/instagram.utils";
import { prisma } from "./config/db.config";
import axios from "axios";

// The commenter's ID from the webhook
const commenterId = "1339905007375409";

async function main() {
    const account = await prisma.instagramAccount.findFirst({
        where: { username: "illustrationced" }
    });

    if (!account) return console.log("Account not found");

    try {
        console.log("Sending template with MESSAGE_TAG POST_PURCHASE_UPDATE...");
        const res = await axios.post(
            `https://graph.instagram.com/v25.0/${account.igUserId}/messages`,
            {
                recipient: { id: commenterId },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: [
                                {
                                    title: "Here is your link",
                                    buttons: [
                                        { type: "web_url", url: "https://cipherlearn.com", title: "Click me" }
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            {
                params: { access_token: account.accessToken },
                headers: { "Content-Type": "application/json" },
            }
        );
        console.log("Template success!", res.data);

    } catch (err: any) {
        console.error("Failed Template:", err.response?.data || err.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
