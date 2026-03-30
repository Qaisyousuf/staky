-- AlterTable
ALTER TABLE "migration_requests" ADD COLUMN     "budget" TEXT,
ADD COLUMN     "teamSize" TEXT;

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "services" TEXT[],
ADD COLUMN     "website" TEXT;
