-- CreateEnum: RecommendationStatus
CREATE TYPE "RecommendationStatus" AS ENUM ('OPEN', 'REVIEWED', 'ACTIONED', 'DISMISSED');

-- CreateEnum: RecommendationActionType
CREATE TYPE "RecommendationActionType" AS ENUM (
  'NONE',
  'ACCELERATE_RELEASE',
  'HOLD_RELEASE',
  'INCREASE_ALLOCATION',
  'REDUCE_EXPOSURE',
  'INCREASE_MERCHANDISING',
  'MAINTAIN',
  'DISMISSED'
);

-- AlterTable: add recommendation workflow columns to products
ALTER TABLE "products"
  ADD COLUMN "recommendationStatus"          "RecommendationStatus",
  ADD COLUMN "recommendationActionType"       "RecommendationActionType",
  ADD COLUMN "recommendationNotes"            TEXT,
  ADD COLUMN "lastRecommendationReviewedAt"   TIMESTAMP(3),
  ADD COLUMN "lastRecommendationActionedAt"   TIMESTAMP(3);
