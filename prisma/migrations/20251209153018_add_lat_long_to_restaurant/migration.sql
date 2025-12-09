/*
  Warnings:

  - You are about to drop the column `mesasOcupadas` on the `Reservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "mesasOcupadas";

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
