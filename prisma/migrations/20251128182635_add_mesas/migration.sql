/*
  Warnings:

  - You are about to drop the column `cantidadMesas` on the `Restaurant` table. All the data in the column will be lost.
  - You are about to drop the column `mesaCapacidad` on the `Restaurant` table. All the data in the column will be lost.
  - You are about to drop the column `mesaTipo` on the `Restaurant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "mesaId" TEXT;

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "cantidadMesas",
DROP COLUMN "mesaCapacidad",
DROP COLUMN "mesaTipo";

-- CreateTable
CREATE TABLE "Mesa" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "tipo" "MesaTipo" NOT NULL,
    "restauranteId" TEXT NOT NULL,

    CONSTRAINT "Mesa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mesa" ADD CONSTRAINT "Mesa_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
