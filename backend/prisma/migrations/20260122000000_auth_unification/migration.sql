-- AlterTable: Make password nullable and add isPasswordSet
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "isPasswordSet" BOOLEAN NOT NULL DEFAULT false;

-- Update existing users: set isPasswordSet=true for users with passwords
UPDATE "users" SET "isPasswordSet" = true WHERE "password" IS NOT NULL;

-- AlterTable: Add userId to students
ALTER TABLE "students" ADD COLUMN "userId" INTEGER;

-- CreateIndex: Unique index on userId
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex: Index on userId for faster lookups
CREATE INDEX "students_userId_idx" ON "students"("userId");

-- Link existing students to users by email match
UPDATE "students" s
SET "userId" = u.id
FROM "users" u
WHERE LOWER(s.email) = LOWER(u.email);

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
