-- Phase 13: Planning Workflow & Decision Capture
--
-- Adds ProductPlanningDecision — one row per human decision event made
-- against a generated allocation plan.  Multiple rows per product are
-- kept so the full history of accepted / overridden / deferred decisions
-- is always available for comparison with eventual outcomes.

-- 1. New enum
CREATE TYPE "PlanningDecisionStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'OVERRIDDEN',
  'DEFERRED'
);

-- 2. Decision table
CREATE TABLE "product_planning_decisions" (
  "id"                          TEXT            NOT NULL,
  "recommendedAllocationSizing" TEXT            NOT NULL,
  "recommendedReleaseTiming"    TEXT            NOT NULL,
  "recommendedRolloutMode"      TEXT            NOT NULL,
  "recommendedPlanConfidence"   TEXT            NOT NULL,
  "signalScoreAtDecision"       DOUBLE PRECISION,
  "inventoryAtDecision"         INTEGER,
  "decisionStatus"              "PlanningDecisionStatus" NOT NULL DEFAULT 'PENDING',
  "selectedAllocationSizing"    TEXT,
  "selectedReleaseTiming"       TEXT,
  "selectedRolloutMode"         TEXT,
  "planningDecisionNotes"       TEXT,
  "plannedByUserId"             TEXT            NOT NULL,
  "plannedAt"                   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                   TIMESTAMP(3)    NOT NULL,
  "productId"                   TEXT            NOT NULL,

  CONSTRAINT "product_planning_decisions_pkey" PRIMARY KEY ("id")
);

-- 3. Foreign keys
ALTER TABLE "product_planning_decisions"
  ADD CONSTRAINT "product_planning_decisions_plannedByUserId_fkey"
    FOREIGN KEY ("plannedByUserId")
    REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_planning_decisions"
  ADD CONSTRAINT "product_planning_decisions_productId_fkey"
    FOREIGN KEY ("productId")
    REFERENCES "products"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Indexes
CREATE INDEX "product_planning_decisions_productId_idx"      ON "product_planning_decisions"("productId");
CREATE INDEX "product_planning_decisions_decisionStatus_idx" ON "product_planning_decisions"("decisionStatus");
CREATE INDEX "product_planning_decisions_plannedAt_idx"      ON "product_planning_decisions"("plannedAt");
