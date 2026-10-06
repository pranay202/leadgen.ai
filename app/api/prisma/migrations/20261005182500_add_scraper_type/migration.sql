-- CreateEnum
CREATE TYPE "ScraperType" AS ENUM ('GOOGLE_MAPS', 'CRAWLEE');

-- AlterTable
ALTER TABLE "ScrapeJob"
ADD COLUMN "scraper" "ScraperType" NOT NULL DEFAULT 'GOOGLE_MAPS';
