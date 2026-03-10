-- CreateEnum
CREATE TYPE "AgeVerificationStatus" AS ENUM ('UNVERIFIED', 'ELIGIBLE', 'INELIGIBLE');

-- AlterTable: extend User with customer profile + age verification fields
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ageVerificationStatus" "AgeVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS "ageVerifiedAt" TIMESTAMP(3);

-- CreateTable: customer delivery addresses
CREATE TABLE IF NOT EXISTS "customer_addresses" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "label"     TEXT NOT NULL DEFAULT 'Home',
    "address1"  TEXT NOT NULL,
    "address2"  TEXT,
    "city"      TEXT NOT NULL,
    "state"     TEXT NOT NULL,
    "zipCode"   TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "customer_addresses"
  ADD CONSTRAINT "customer_addresses_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
