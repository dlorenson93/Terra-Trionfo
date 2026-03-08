-- Add new enums (IF NOT EXISTS via DO block)
DO $$ BEGIN
  CREATE TYPE "CommerceModel" AS ENUM ('MARKETPLACE', 'WHOLESALE', 'HYBRID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ListingOwner" AS ENUM ('VENDOR', 'TERRA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FulfillmentType" AS ENUM ('PICKUP', 'LOCAL_DELIVERY', 'SHIP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Make users.role nullable
ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;

-- Add profileCompleted to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Add new company columns
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT;

-- Add unique index on companies.slug (only if slug column was just added)
CREATE UNIQUE INDEX IF NOT EXISTS "companies_slug_key" ON "companies"("slug");

-- Add new product columns
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "commerceModel" "CommerceModel" NOT NULL DEFAULT 'MARKETPLACE';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "listingOwner" "ListingOwner" NOT NULL DEFAULT 'VENDOR';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "vendorPriceCents" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "wholesalePriceCents" INTEGER;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "retailPriceCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allowedFulfillment" "FulfillmentType"[] DEFAULT ARRAY['PICKUP'::"FulfillmentType", 'LOCAL_DELIVERY'::"FulfillmentType"];

-- Add new order columns
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'PICKUP';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "scheduledDeliveryDate" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickupLocationId" TEXT;

-- Add commerceModel to order_items
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "commerceModel" "CommerceModel" NOT NULL DEFAULT 'MARKETPLACE';

-- Add new settings columns
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "deliveryAllowedStates" TEXT[] DEFAULT ARRAY['MA']::TEXT[];
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "deliveryDaysOfWeek" INTEGER[] DEFAULT ARRAY[2,4,6];
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0;
