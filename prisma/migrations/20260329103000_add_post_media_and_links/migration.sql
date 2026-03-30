ALTER TABLE "alternative_posts"
ADD COLUMN "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "linkUrl" TEXT,
ADD COLUMN "linkDomain" TEXT,
ADD COLUMN "linkTitle" TEXT,
ADD COLUMN "linkDescription" TEXT,
ADD COLUMN "linkImage" TEXT;

UPDATE "alternative_posts"
SET "imageUrls" = ARRAY[]::TEXT[]
WHERE "imageUrls" IS NULL;

ALTER TABLE "alternative_posts"
ALTER COLUMN "imageUrls" SET NOT NULL,
ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]::TEXT[];
