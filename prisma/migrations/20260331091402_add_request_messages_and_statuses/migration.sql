-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MigrationRequestStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "MigrationRequestStatus" ADD VALUE 'ACCEPTED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REQUEST_MESSAGE';

-- AlterTable
ALTER TABLE "migration_requests" ADD COLUMN     "urgency" TEXT,
ADD COLUMN     "userGoals" TEXT;

-- CreateTable
CREATE TABLE "request_messages" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "request_messages_requestId_createdAt_idx" ON "request_messages"("requestId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "request_messages_senderId_idx" ON "request_messages"("senderId");

-- AddForeignKey
ALTER TABLE "request_messages" ADD CONSTRAINT "request_messages_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "migration_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_messages" ADD CONSTRAINT "request_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
