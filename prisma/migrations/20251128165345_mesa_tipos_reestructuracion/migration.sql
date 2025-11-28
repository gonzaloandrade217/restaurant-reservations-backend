/*
  Warnings:

  - You are about to drop the column `tableId` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `Restaurant` table. All the data in the column will be lost.
  - You are about to drop the `Table` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MesaTipo" AS ENUM ('CUADRADA', 'RECTANGULAR', 'REDONDA');

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_tableId_fkey";

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_restaurantId_fkey";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "tableId",
ADD COLUMN     "exceptionDescription" TEXT;

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "capacity",
ADD COLUMN     "mesaCapacidad" INTEGER,
ADD COLUMN     "mesaTipo" "MesaTipo";

-- DropTable
DROP TABLE "Table";
