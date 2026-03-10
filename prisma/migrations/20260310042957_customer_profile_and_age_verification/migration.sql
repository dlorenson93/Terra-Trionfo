/*
  Warnings:

  - You are about to drop the column `modelType` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `basePrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `consumerPrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isMarketplace` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isWholesale` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `wholesaleCost` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customer_addresses" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "modelType",
ALTER COLUMN "commerceModel" DROP DEFAULT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "fulfillmentType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pickup_locations" ADD COLUMN     "contentStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "pickupType" TEXT NOT NULL DEFAULT 'WAREHOUSE',
ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "products" DROP COLUMN "basePrice",
DROP COLUMN "consumerPrice",
DROP COLUMN "isMarketplace",
DROP COLUMN "isWholesale",
DROP COLUMN "wholesaleCost",
ALTER COLUMN "retailPriceCents" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_routes" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "deliveryDay" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_schedules" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "pickupDay" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "heroImageUrl" TEXT,
    "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cuisineType" TEXT,
    "priceRange" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_wines" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "servingType" TEXT NOT NULL DEFAULT 'BOTTLE_LIST',
    "notes" TEXT,

    CONSTRAINT "restaurant_wines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_zones_code_key" ON "delivery_zones"("code");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_wines_restaurantId_productId_key" ON "restaurant_wines"("restaurantId", "productId");

-- AddForeignKey
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "delivery_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_schedules" ADD CONSTRAINT "pickup_schedules_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "pickup_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_wines" ADD CONSTRAINT "restaurant_wines_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_wines" ADD CONSTRAINT "restaurant_wines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
