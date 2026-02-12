-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "time" TEXT DEFAULT '00:00',
ALTER COLUMN "date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "RestaurantDayCapacity" ALTER COLUMN "date" SET DATA TYPE DATE;
