import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Updating rule #5 to be a TEMPLATE...")
    const updated = await prisma.automationRule.update({
        where: { id: 5 },
        data: {
            dmType: "TEMPLATE",
            dmButtons: [
                { title: "View Course", url: "https://google.com" }
            ]
        }
    })
    console.log("Updated Rule:", updated)
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
