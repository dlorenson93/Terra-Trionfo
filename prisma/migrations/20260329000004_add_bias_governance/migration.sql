-- Migration: add_bias_governance
-- Phase 9.6 — Bias Governance & Safe Recommendation Weighting
-- Adds BiasDataSufficiencyStatus + BiasMode enums and BiasGovernance singleton table.

-- 1. BiasDataSufficiencyStatus enum
CREATE TYPE "BiasDataSufficiencyStatus" AS ENUM (
  'INSUFFICIENT',
  'MARGINAL',
  'SUFFICIENT',
  'STRONG'
);

-- 2. BiasMode enum
CREATE TYPE "BiasMode" AS ENUM (
  'OFF',
  'OBSERVE_ONLY',
  'APPLY_TO_CONFIDENCE'
);

-- 3. BiasGovernance singleton table
CREATE TABLE "bias_governance" (
  "id"                            TEXT          NOT NULL DEFAULT 'singleton',
  "biasEnabled"                   BOOLEAN       NOT NULL DEFAULT false,
  "biasMode"                      "BiasMode"    NOT NULL DEFAULT 'OBSERVE_ONLY',
  "biasDataSufficiencyStatus"     "BiasDataSufficiencyStatus",
  "biasLastAppliedAt"             TIMESTAMPTZ,
  "biasLastComputedAt"            TIMESTAMPTZ,
  "totalMeasuredAtLastCompute"    INTEGER,
  "updatedAt"                     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updatedByUserId"               TEXT,
  CONSTRAINT "bias_governance_pkey" PRIMARY KEY ("id")
);

-- 4. Insert the singleton row so it always exists
INSERT INTO "bias_governance" ("id", "biasEnabled", "biasMode", "updatedAt")
VALUES ('singleton', false, 'OBSERVE_ONLY', now())
ON CONFLICT DO NOTHING;
