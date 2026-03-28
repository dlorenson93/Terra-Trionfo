-- CreateTable: waitlists
CREATE TABLE "waitlists" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,

    CONSTRAINT "waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable: trade_interests
CREATE TABLE "trade_interests" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "business"    TEXT NOT NULL,
    "email"       TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "region"      TEXT,
    "caseInterest" INTEGER,
    "notes"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId"   TEXT NOT NULL,

    CONSTRAINT "trade_interests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waitlists_productId_idx" ON "waitlists"("productId");
CREATE INDEX "waitlists_email_idx" ON "waitlists"("email");

-- CreateIndex
CREATE INDEX "trade_interests_productId_idx" ON "trade_interests"("productId");
CREATE INDEX "trade_interests_email_idx" ON "trade_interests"("email");

-- AddForeignKey
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_interests" ADD CONSTRAINT "trade_interests_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
