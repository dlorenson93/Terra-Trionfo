-- Migration: add_release_intelligence_enums_and_fields
-- Repair migration for Phase 9 release intelligence fields.
--
-- These enums and product columns were originally created via `prisma db push`
-- and were never included in a tracked migration file.
-- This migration uses safe-to-replay patterns so it is idempotent:
--   - DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;
--     for CREATE TYPE (PostgreSQL does not support CREATE TYPE IF NOT EXISTS)
--   - ALTER TABLE ... ADD COLUMN IF NOT EXISTS
--     for product columns (safe to re-run on live DB where columns exist)
--
-- Sorts between 000000_add_recommendation_workflow and
-- 000001_add_recommendation_history so that the ReleaseMonitorStatus and
-- ExposureTier types exist before the history table is created.

-- 1. ExposureTier enum
DO $$ BEGIN
  CREATE TYPE "ExposureTier" AS ENUM (
    'LOW',
    'STANDARD',
    'PRIORITY',
    'LIMITED'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. ReleaseMonitorStatus enum
DO $$ BEGIN
  CREATE TYPE "ReleaseMonitorStatus" AS ENUM (
    'STABLE',
    'NEEDS_REVIEW',
    'HIGH_DEMAND',
    'UNDERPERFORMING',
    'ALLOCATION_PRESSURE',
    'UPCOMING_INTEREST'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Release intelligence columns on products
--    All use IF NOT EXISTS — safe to run on a live DB where they already exist.
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "releaseActivatedAt"       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "releaseLastReviewedAt"    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "allocationLastAdjustedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "releasePriority"          INTEGER,
  ADD COLUMN IF NOT EXISTS "releaseMonitorStatus"     "ReleaseMonitorStatus",
  ADD COLUMN IF NOT EXISTS "exposureTier"             "ExposureTier",
  ADD COLUMN IF NOT EXISTS "lastRecommendationAt"     TIMESTAMPTZ;
