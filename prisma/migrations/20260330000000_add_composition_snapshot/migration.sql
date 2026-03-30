-- Phase 21: Planning Outcome Attribution & Model Trust Analytics
--
-- Adds score composition snapshot fields to product_planning_decisions so
-- that when an admin makes a planning decision the full composition used at
-- that time is captured for retrospective attribution analysis.
--
-- These fields feed planningAttributionRollups.ts which answers:
--   "Which contributors (bias / predictive / pattern) are directionally
--    correlated with positive post-decision outcomes?"

ALTER TABLE "product_planning_decisions"
  ADD COLUMN IF NOT EXISTS "compositeBaseConfidence"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "compositeBiasAdjustment"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "compositePredictiveNudge" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "compositePatternDelta"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "compositeFinalScore"      DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "compositeLabel"           TEXT;
