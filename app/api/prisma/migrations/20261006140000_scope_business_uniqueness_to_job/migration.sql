DROP INDEX IF EXISTS "Business_phone_website_key";

CREATE UNIQUE INDEX "Business_scrapeJobId_phone_website_key"
ON "Business"("scrapeJobId", "phone", "website");
