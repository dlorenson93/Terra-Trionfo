-- Migration: add_recommendation_resolution
-- Adds RecommendationResolutionStatus enum, two new columns on products,
-- and two snapshot columns on product_recommendation_history.

-- 1. Create enum
CREATE TYPE "RecommendationResolutionStatus" AS ENUM (
  'UNRESOLVED',
  'IMPROVING',
  'RESOLVED',
  'REQUIRES_FOLLOW_UP'
);

-- 2. Products — resolution tracking columns
ALTER TABLE "products"
  ADD COLUMN "recommendation_resolution_status" "RecommendationResolutionStatus",
  ADD COLUMN "last_recommendation_resolved_at"  TIMESTAMPTZ;

-- 3. History — capture before/after resolution state on each audit row
ALTER TABLE "product_recommendation_history"
  ADD COLUMN "previous_resolution_status" "RecommendationResolutionStatus",
  ADD COLUMN "new_resolution_status"      "RecommendationResolutionStatus";
