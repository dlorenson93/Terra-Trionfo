/*
  Warnings:

  - You are about to drop the column `effectiveness_delta` on the `product_recommendation_history` table. All the data in the column will be lost.
  - You are about to drop the column `new_resolution_status` on the `product_recommendation_history` table. All the data in the column will be lost.
  - You are about to drop the column `post_action_signal_score` on the `product_recommendation_history` table. All the data in the column will be lost.
  - You are about to drop the column `pre_action_signal_score` on the `product_recommendation_history` table. All the data in the column will be lost.
  - You are about to drop the column `previous_resolution_status` on the `product_recommendation_history` table. All the data in the column will be lost.
  - You are about to drop the column `effectiveness_delta` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `effectiveness_last_computed_at` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `effectiveness_reason` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `last_recommendation_resolved_at` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `post_action_signal_score` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `pre_action_exposure_tier` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `pre_action_monitor_status` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `pre_action_signal_score` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `recommendation_resolution_status` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bias_governance" ALTER COLUMN "biasLastAppliedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "biasLastComputedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "product_recommendation_history" DROP COLUMN "effectiveness_delta",
DROP COLUMN "new_resolution_status",
DROP COLUMN "post_action_signal_score",
DROP COLUMN "pre_action_signal_score",
DROP COLUMN "previous_resolution_status",
ADD COLUMN     "effectivenessDelta" "EffectivenessDelta",
ADD COLUMN     "newResolutionStatus" "RecommendationResolutionStatus",
ADD COLUMN     "postActionSignalScore" INTEGER,
ADD COLUMN     "preActionSignalScore" INTEGER,
ADD COLUMN     "previousResolutionStatus" "RecommendationResolutionStatus";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "effectiveness_delta",
DROP COLUMN "effectiveness_last_computed_at",
DROP COLUMN "effectiveness_reason",
DROP COLUMN "last_recommendation_resolved_at",
DROP COLUMN "post_action_signal_score",
DROP COLUMN "pre_action_exposure_tier",
DROP COLUMN "pre_action_monitor_status",
DROP COLUMN "pre_action_signal_score",
DROP COLUMN "recommendation_resolution_status",
ADD COLUMN     "effectivenessDelta" "EffectivenessDelta",
ADD COLUMN     "effectivenessLastComputedAt" TIMESTAMP(3),
ADD COLUMN     "effectivenessReason" TEXT,
ADD COLUMN     "lastRecommendationResolvedAt" TIMESTAMP(3),
ADD COLUMN     "postActionSignalScore" INTEGER,
ADD COLUMN     "preActionExposureTier" "ExposureTier",
ADD COLUMN     "preActionMonitorStatus" "ReleaseMonitorStatus",
ADD COLUMN     "preActionSignalScore" INTEGER,
ADD COLUMN     "recommendationResolutionStatus" "RecommendationResolutionStatus",
ALTER COLUMN "releaseActivatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "releaseLastReviewedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "allocationLastAdjustedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "lastRecommendationAt" SET DATA TYPE TIMESTAMP(3);
