/*
  Warnings:

  - The values [DOMICILIO_CERRADO] on the enum `EvidenceType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `created_at` on the `Evidence` table. All the data in the column will be lost.
  - You are about to drop the column `ai_suggested_priority` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `ai_suggested_specialty` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `client_description` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `current_priority` on the `Ticket` table. All the data in the column will be lost.
  - You are about to alter the column `latitude` on the `Ticket` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,8)`.
  - You are about to alter the column `longitude` on the `Ticket` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(11,8)`.
  - You are about to drop the column `full_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `prefix` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `specialty` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `supply_number` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Ticket_Log` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[access_code]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customer_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Made the column `due_date` on table `Ticket` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `first_name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name_mat` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name_pat` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLI_', 'ESP_', 'ADM_', 'JEF_');

-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('CREADO', 'ASIGNADO', 'REASIGNADO', 'EN_CAMINO', 'TECNICO_AFUERA', 'CLIENTE_EN_CASA', 'CLIENTE_AUSENTE', 'EJECUCION_ACTIVA', 'PRE_CERRADO', 'RECHAZADO', 'CERRADO', 'PRIORIDAD_CAMBIADA');

-- AlterEnum
BEGIN;
CREATE TYPE "EvidenceType_new" AS ENUM ('REPORTE_INICIAL', 'RESOLUCION_FINAL', 'AUSENCIA');
ALTER TABLE "Evidence" ALTER COLUMN "type" TYPE "EvidenceType_new" USING ("type"::text::"EvidenceType_new");
ALTER TYPE "EvidenceType" RENAME TO "EvidenceType_old";
ALTER TYPE "EvidenceType_new" RENAME TO "EvidenceType";
DROP TYPE "EvidenceType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'ASIGNADO';

-- DropForeignKey
ALTER TABLE "Evidence" DROP CONSTRAINT "Evidence_ticket_id_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_ticket_id_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Ticket_Log" DROP CONSTRAINT "Ticket_Log_ticket_id_fkey";

-- DropForeignKey
ALTER TABLE "Ticket_Log" DROP CONSTRAINT "Ticket_Log_user_id_fkey";

-- AlterTable
ALTER TABLE "Evidence" DROP COLUMN "created_at",
ADD COLUMN     "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "ticket_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "ai_suggested_priority",
DROP COLUMN "ai_suggested_specialty",
DROP COLUMN "client_description",
DROP COLUMN "current_priority",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "ai_difficulty" TEXT,
ADD COLUMN     "ai_priority" "Priority",
ADD COLUMN     "ai_report" TEXT,
ADD COLUMN     "ai_specialty" TEXT,
ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "closed_by_id" INTEGER,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIA',
ADD COLUMN     "reference_point" TEXT,
ADD COLUMN     "specialty_id" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "latitude" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "longitude" SET DATA TYPE DECIMAL(11,8),
ALTER COLUMN "due_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "full_name",
DROP COLUMN "prefix",
DROP COLUMN "specialty",
DROP COLUMN "supply_number",
ADD COLUMN     "access_code" TEXT,
ADD COLUMN     "customer_id" INTEGER,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "last_name_mat" TEXT NOT NULL,
ADD COLUMN     "last_name_pat" TEXT NOT NULL,
ADD COLUMN     "role" "Role" NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "Ticket_Log";

-- DropEnum
DROP TYPE "Prefix";

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "supply_code" TEXT NOT NULL,
    "reference_amount" DECIMAL(10,2) NOT NULL,
    "doc_type" TEXT NOT NULL DEFAULT 'DNI',
    "doc_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name_pat" TEXT NOT NULL,
    "last_name_mat" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSpecialty" (
    "user_id" INTEGER NOT NULL,
    "specialty_id" INTEGER NOT NULL,

    CONSTRAINT "UserSpecialty_pkey" PRIMARY KEY ("user_id","specialty_id")
);

-- CreateTable
CREATE TABLE "TicketLog" (
    "id" SERIAL NOT NULL,
    "action" "LogAction" NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticket_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "TicketLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechReport" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticket_id" INTEGER NOT NULL,
    "tech_id" INTEGER NOT NULL,
    "evidences_urls" TEXT[],

    CONSTRAINT "TechReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSurvey" (
    "id" SERIAL NOT NULL,
    "nps_score" INTEGER NOT NULL,
    "comment" TEXT,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticket_id" INTEGER NOT NULL,

    CONSTRAINT "ClientSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_supply_code_key" ON "Customer"("supply_code");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_name_key" ON "Specialty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TechReport_ticket_id_key" ON "TechReport"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSurvey_ticket_id_key" ON "ClientSurvey"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_code_key" ON "Ticket"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_access_code_key" ON "User"("access_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_customer_id_key" ON "User"("customer_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpecialty" ADD CONSTRAINT "UserSpecialty_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpecialty" ADD CONSTRAINT "UserSpecialty_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketLog" ADD CONSTRAINT "TicketLog_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketLog" ADD CONSTRAINT "TicketLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechReport" ADD CONSTRAINT "TechReport_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechReport" ADD CONSTRAINT "TechReport_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSurvey" ADD CONSTRAINT "ClientSurvey_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
