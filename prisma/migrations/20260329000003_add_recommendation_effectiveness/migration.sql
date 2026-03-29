-- Migration: add_recommendation_effectiveness
-- Adds EffectivenessDelta enum and effectiveness tracking fields on products.
-- Also adds preActionSignalScore snapshot column on product_recommendation_history.

-- 1. Create enum
CREATE TYPE "EffectivenessDelta" AS ENUM (
  'POSITIVE_SHIFT',
  'NO_MEANINGFUL_CHANGE',
  'NEGATIVE_SHIFT',
  'MIXED_RESULT'
);

-- 2. Product — pre-action signal snapshot (written at ACTIONED time)
--            + post-action effectiveness (written at follow-up check time)
ALTER TABLE "products"
  ADD COLUMN "pre_action_monitor_status"       "ReleaseMonitorStatus",
  ADD COLUMN "pre_action_exposure_tier"        "ExposureTier",
  ADD COLUMN "pre_action_signal_score"         INTEGER,
  ADD COLUMN "post_action_signal_score"        INTEGER,
  ADD COLUMN "effectiveness_delta"             "EffectivenessDelta",
  ADD COLUMN "effectiveness_reason"            TEXT,
  ADD COLUMN "effectiveness_last_computed_at"  TIMESTAMPTZ;

-- 3. History — capture signal score snapshot on each audit row
ALTER TABLE "product_recommendation_history"
  ADD COLUMN "pre_action_signal_score"  INTEGER,
  ADD COLUMN "post_action_signal_score" INTEGER,
  ADD COLUMN "effectiveness_delta"      "EffectivenessDelta";
