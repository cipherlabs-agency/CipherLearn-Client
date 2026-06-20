-- CreateTable
CREATE TABLE "resource_stars" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_stars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_stars_studentId_idx" ON "resource_stars"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_stars_studentId_resourceType_resourceId_key" ON "resource_stars"("studentId", "resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "resource_stars" ADD CONSTRAINT "resource_stars_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
