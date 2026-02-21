import { prisma } from "./config/db.config"

async function main() {
    const accounts = await prisma.instagramAccount.findMany()
    console.log("All Accounts:", JSON.stringify(accounts, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
