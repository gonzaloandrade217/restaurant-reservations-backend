-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "tablesUsed" INTEGER;

-- CreateTable
CREATE TABLE "RestaurantDayCapacity" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tablesUsed" INTEGER NOT NULL,

    CONSTRAINT "RestaurantDayCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantDayCapacity_restaurantId_date_key" ON "RestaurantDayCapacity"("restaurantId", "date");

-- AddForeignKey
ALTER TABLE "RestaurantDayCapacity" ADD CONSTRAINT "RestaurantDayCapacity_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
