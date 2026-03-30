-- Phase 14: Execution Tracking & Plan Adherence
--
-- Adds execution fields to product_planning_decisions so the system can
-- record what was actually done vs what was recommended / selected.
-- Also adds planAdherence — a derived label computed on write:
--   matched_recommendation | matched_decision | recommendation_restored
--   | deviated_from_decision | partially_executed | not_executed

-- 1. New enum
CREATE TYPE "PlanExecutionStatus" AS ENUM (
  'PENDING',
  'EXECUTED',
  'PARTIAL',
  'DEVIATED',
  'NOT_EXECUTED'
);

-- 2. New columns on product_planning_decisions
ALTER TABLE "product_planning_decisions"
  ADD COLUMN IF NOT EXISTS "executionStatus"          "PlanExecutionStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "executedAllocationSizing" TEXT,
  ADD COLUMN IF NOT EXISTS "executedReleaseTiming"    TEXT,
  ADD COLUMN IF NOT EXISTS "executedRolloutMode"      TEXT,
  ADD COLUMN IF NOT EXISTS "executionNotes"           TEXT,
  ADD COLUMN IF NOT EXISTS "executedAt"               TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "executedByUserId"         TEXT,
  ADD COLUMN IF NOT EXISTS "executedByUserName"       TEXT,
  ADD COLUMN IF NOT EXISTS "planAdherence"            TEXT;

-- 3. Index on executionStatus for reporting queries
CREATE INDEX "product_planning_decisions_executionStatus_idx"
  ON "product_planning_decisions"("executionStatus");
