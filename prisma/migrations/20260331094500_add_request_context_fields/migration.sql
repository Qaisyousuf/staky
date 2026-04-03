ALTER TABLE "migration_requests"
ADD COLUMN "requestSource" TEXT,
ADD COLUMN "contextKey" TEXT,
ADD COLUMN "switches" JSONB;

CREATE INDEX "migration_requests_userId_contextKey_idx"
ON "migration_requests"("userId", "contextKey");
