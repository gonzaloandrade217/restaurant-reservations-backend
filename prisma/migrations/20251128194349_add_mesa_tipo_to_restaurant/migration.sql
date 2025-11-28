/*
  Warnings:

  - You are about to drop the column `mesaId` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the `Mesa` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Mesa" DROP CONSTRAINT "Mesa_restauranteId_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_mesaId_fkey";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "mesaId";

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "cantidadMesas" INTEGER,
ADD COLUMN     "mesaCapacidad" INTEGER,
ADD COLUMN     "mesaTipo" "MesaTipo";

-- DropTable
DROP TABLE "Mesa";
