import { prisma } from "./config/db.config"

async function main() {
    const account = await prisma.instagramAccount.findFirst({
        where: { username: "illustrationced" }
    })

    if (account) {
        console.log("Updating account igUserId to 17841460075306469...")
        await prisma.instagramAccount.update({
            where: { id: account.id },
            data: { igUserId: "17841460075306469" }
        })
        console.log("Updated successfully")
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
