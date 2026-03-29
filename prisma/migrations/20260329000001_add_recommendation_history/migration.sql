-- CreateTable: product_recommendation_history
CREATE TABLE "product_recommendation_history" (
    "id"                   TEXT NOT NULL,
    "previousStatus"       "RecommendationStatus",
    "newStatus"            "RecommendationStatus" NOT NULL,
    "previousActionType"   "RecommendationActionType",
    "newActionType"        "RecommendationActionType",
    "note"                 TEXT,
    "releaseMonitorStatus" "ReleaseMonitorStatus",
    "exposureTier"         "ExposureTier",
    "changedByUserId"      TEXT NOT NULL,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId"            TEXT NOT NULL,

    CONSTRAINT "product_recommendation_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_recommendation_history_productId_idx"
    ON "product_recommendation_history"("productId");

CREATE INDEX "product_recommendation_history_createdAt_idx"
    ON "product_recommendation_history"("createdAt");

-- AddForeignKey
ALTER TABLE "product_recommendation_history"
    ADD CONSTRAINT "product_recommendation_history_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_recommendation_history"
    ADD CONSTRAINT "product_recommendation_history_changedByUserId_fkey"
    FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
