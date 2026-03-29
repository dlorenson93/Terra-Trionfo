-- Phase 11: add confidence snapshot fields to ProductRecommendationHistory
-- These are captured at ACTIONED time for calibration tracking:
--   "when the system said high confidence, was it right more often?"
--
-- All columns nullable — historical rows will have NULL for all four fields;
-- only new ACTIONED rows (created after Phase 11 deploy) will be populated.

ALTER TABLE "product_recommendation_history"
  ADD COLUMN IF NOT EXISTS "baseConfidenceScore"     INTEGER,
  ADD COLUMN IF NOT EXISTS "adjustedConfidenceScore" INTEGER,
  ADD COLUMN IF NOT EXISTS "biasApplied"             BOOLEAN,
  ADD COLUMN IF NOT EXISTS "biasMultiplier"          DOUBLE PRECISION;
