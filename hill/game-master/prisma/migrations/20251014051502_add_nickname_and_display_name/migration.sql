/*
  Warnings:

  - Added the required column `displayName` to the `Seat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nickname` to the `Seat` table without a default value. This is not possible if the table is not empty.

*/

-- For existing rows, we'll set default values based on seatId
-- AlterTable - Add columns with temporary default
ALTER TABLE "Seat" ADD COLUMN "nickname" VARCHAR(64) NOT NULL DEFAULT 'Player',
ADD COLUMN "displayName" VARCHAR(100) NOT NULL DEFAULT 'Player#0000';

-- Update existing rows to use seatId as nickname and displayName
UPDATE "Seat" SET "nickname" = "seatId", "displayName" = "seatId" || '#' || SUBSTRING("id" FROM 1 FOR 4);

-- Remove default constraint (optional, keeping it for safety)
-- ALTER TABLE "Seat" ALTER COLUMN "nickname" DROP DEFAULT;
-- ALTER TABLE "Seat" ALTER COLUMN "displayName" DROP DEFAULT;
