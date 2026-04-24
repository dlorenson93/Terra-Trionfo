-- DropIndex
DROP INDEX "product_planning_decisions_executionStatus_idx";

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "showConsumerPrices" BOOLEAN NOT NULL DEFAULT false;
