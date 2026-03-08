-- AlterTable companies: add producer storytelling fields
ALTER TABLE "companies" ADD COLUMN "shortDescription" TEXT;
ALTER TABLE "companies" ADD COLUMN "story" TEXT;
ALTER TABLE "companies" ADD COLUMN "subregion" TEXT;
ALTER TABLE "companies" ADD COLUMN "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "companies" ADD COLUMN "locationLat" DOUBLE PRECISION;
ALTER TABLE "companies" ADD COLUMN "locationLng" DOUBLE PRECISION;
ALTER TABLE "companies" ADD COLUMN "sustainablePractices" TEXT;
ALTER TABLE "companies" ADD COLUMN "winemakerName" TEXT;
ALTER TABLE "companies" ADD COLUMN "winemakerBio" TEXT;
ALTER TABLE "companies" ADD COLUMN "foodPairingNotes" TEXT;
ALTER TABLE "companies" ADD COLUMN "foundedYear" INTEGER;
ALTER TABLE "companies" ADD COLUMN "isFoundingProducer" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable products: add wine-specific and editorial fields
ALTER TABLE "products" ADD COLUMN "slug" TEXT UNIQUE;
ALTER TABLE "products" ADD COLUMN "producerDisplayName" TEXT;
ALTER TABLE "products" ADD COLUMN "vintage" INTEGER;
ALTER TABLE "products" ADD COLUMN "appellation" TEXT;
ALTER TABLE "products" ADD COLUMN "designation" TEXT;
ALTER TABLE "products" ADD COLUMN "country" TEXT;
ALTER TABLE "products" ADD COLUMN "region" TEXT;
ALTER TABLE "products" ADD COLUMN "subregion" TEXT;
ALTER TABLE "products" ADD COLUMN "grapeVarietals" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "products" ADD COLUMN "wineStyle" TEXT;
ALTER TABLE "products" ADD COLUMN "body" TEXT;
ALTER TABLE "products" ADD COLUMN "acidity" TEXT;
ALTER TABLE "products" ADD COLUMN "tannin" TEXT;
ALTER TABLE "products" ADD COLUMN "abv" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN "bottleSizeMl" INTEGER;
ALTER TABLE "products" ADD COLUMN "tastingNotesShort" TEXT;
ALTER TABLE "products" ADD COLUMN "tastingNotesFull" TEXT;
ALTER TABLE "products" ADD COLUMN "aromaNotes" TEXT;
ALTER TABLE "products" ADD COLUMN "palateNotes" TEXT;
ALTER TABLE "products" ADD COLUMN "finishNotes" TEXT;
ALTER TABLE "products" ADD COLUMN "vinification" TEXT;
ALTER TABLE "products" ADD COLUMN "aging" TEXT;
ALTER TABLE "products" ADD COLUMN "vineyardNotes" TEXT;
ALTER TABLE "products" ADD COLUMN "servingTemperature" TEXT;
ALTER TABLE "products" ADD COLUMN "decantingNotes" TEXT;
ALTER TABLE "products" ADD COLUMN "foodPairings" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "products" ADD COLUMN "sustainabilityNotes" TEXT;
ALTER TABLE "products" ADD COLUMN "producerStoryExcerpt" TEXT;
ALTER TABLE "products" ADD COLUMN "isLimitedAllocation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "isFoundingWine" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "badgeText" TEXT;

-- CreateTable pickup_locations
CREATE TABLE "pickup_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_locations_pkey" PRIMARY KEY ("id")
);
