/*
  Warnings:

  - Added the required column `capacity` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Restaurant" ADD COLUMN     "capacity" INTEGER NOT NULL;
