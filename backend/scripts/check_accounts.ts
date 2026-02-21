import { PrismaClient } from '../prisma/generated/prisma'

const prisma = new PrismaClient()

async function main() {
    const accounts = await prisma.instagramAccount.findMany()
    console.log("All Accounts:", accounts)
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
