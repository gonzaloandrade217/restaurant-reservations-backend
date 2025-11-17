-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "status" "public"."ReservationStatus" NOT NULL DEFAULT 'PENDING';
