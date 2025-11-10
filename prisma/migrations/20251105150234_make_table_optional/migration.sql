-- DropForeignKey
ALTER TABLE "public"."Reservation" DROP CONSTRAINT "Reservation_tableId_fkey";

-- AlterTable
ALTER TABLE "public"."Reservation" ALTER COLUMN "tableId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "public"."Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
