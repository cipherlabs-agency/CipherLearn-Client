import axios from "axios";
import { prisma } from "./config/db.config";

async function main() {
    const accounts = await prisma.instagramAccount.findMany();
    if (accounts.length === 0) {
        console.log("No accounts found");
        return;
    }

    const token = accounts[0].accessToken;
    console.log("Testing with token for:", accounts[0].username);

    try {
        const res = await axios.get("https://graph.instagram.com/v25.0/me", {
            params: {
                fields: "id,username,user_id,followers_count",
                access_token: token
            }
        });
        console.log("User Profile:", res.data);
    } catch (err: any) {
        console.error("Error:", err.response?.data || err.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
