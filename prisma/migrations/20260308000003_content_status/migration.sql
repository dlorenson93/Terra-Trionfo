-- Create ContentStatus enum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'READY', 'LIVE');

-- Add contentStatus to companies (default DRAFT for new records)
ALTER TABLE "companies" ADD COLUMN "contentStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT';

-- Add contentStatus to products (default DRAFT for new records)
ALTER TABLE "products" ADD COLUMN "contentStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT';
