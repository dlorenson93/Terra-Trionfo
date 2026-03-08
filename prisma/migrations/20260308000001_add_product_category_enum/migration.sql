-- Add ProductCategory enum
DO $$ BEGIN
  CREATE TYPE "ProductCategory" AS ENUM ('WINE', 'OLIVE_OIL', 'SPIRITS', 'BEER', 'FOOD', 'ACCESSORIES', 'MERCH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Change products.category from TEXT to ProductCategory enum
-- First add a new column, migrate data, drop old, rename
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "categoryEnum" "ProductCategory";

-- Map existing string values to enum (best-effort)
UPDATE "products" SET "categoryEnum" = 'WINE' WHERE lower("category") LIKE '%wine%' OR lower("category") LIKE '%vino%';
UPDATE "products" SET "categoryEnum" = 'OLIVE_OIL' WHERE lower("category") LIKE '%oil%' OR lower("category") LIKE '%olive%' OR lower("category") LIKE '%vinegar%';
UPDATE "products" SET "categoryEnum" = 'FOOD' WHERE "categoryEnum" IS NULL AND (lower("category") LIKE '%pasta%' OR lower("category") LIKE '%grain%' OR lower("category") LIKE '%canned%' OR lower("category") LIKE '%food%' OR lower("category") LIKE '%specialty%');

-- Default any unmapped rows to WINE so NOT NULL can be enforced
UPDATE "products" SET "categoryEnum" = 'WINE' WHERE "categoryEnum" IS NULL;

-- Drop old text column and rename
ALTER TABLE "products" DROP COLUMN IF EXISTS "category";
ALTER TABLE "products" RENAME COLUMN "categoryEnum" TO "category";

-- Enforce NOT NULL
ALTER TABLE "products" ALTER COLUMN "category" SET NOT NULL;
