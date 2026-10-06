-- Allow a single scrape attempt to request the full 1,000-business limit.
ALTER TABLE "User" ALTER COLUMN "leadsLimit" SET DEFAULT 1000;

-- Existing users should receive the same baseline as newly registered users.
UPDATE "User"
SET "leadsLimit" = 1000
WHERE "leadsLimit" < 1000;
