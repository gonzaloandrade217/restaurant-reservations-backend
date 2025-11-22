-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "avatar" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
