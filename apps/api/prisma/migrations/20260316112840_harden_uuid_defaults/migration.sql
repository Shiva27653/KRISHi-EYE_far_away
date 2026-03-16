/*
  Warnings:

  - The primary key for the `advisory_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `farm_id` column on the `advisory_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `fts_doc` on the `agri_docs` table. All the data in the column will be lost.
  - The primary key for the `analytics_snapshots` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `audit_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `actor_user_id` column on the `audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `consent_records` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `farm_members` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `farmer_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `farms` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `fields` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `knowledge_chunks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `knowledge_sources` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `operation_jobs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `support_contacts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `support_organizations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `support_tickets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `farm_id` column on the `support_tickets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `assigned_to_user_id` column on the `support_tickets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `field_id` column on the `support_tickets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tractor_id` column on the `support_tickets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `job_id` column on the `support_tickets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `tractors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `advisory_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `advisory_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `analytics_snapshots` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `farm_id` on the `analytics_snapshots` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `consent_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `consent_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `farm_members` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `farm_id` on the `farm_members` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `farm_members` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `farmer_profiles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `farmer_profiles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `farms` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `owner_user_id` on the `farms` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `fields` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `farm_id` on the `fields` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `knowledge_chunks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `source_id` on the `knowledge_chunks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `knowledge_sources` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `operation_jobs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tractor_id` on the `operation_jobs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `field_id` on the `operation_jobs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `support_contacts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `organization_id` on the `support_contacts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `support_organizations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `support_tickets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `support_tickets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tractor_id` on the `telemetry_points` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `job_id` on the `telemetry_points` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `tractors` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `farm_id` on the `tractors` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "advisory_logs" DROP CONSTRAINT IF EXISTS "advisory_logs_farm_id_fkey";

-- DropForeignKey
ALTER TABLE "advisory_logs" DROP CONSTRAINT IF EXISTS "advisory_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "analytics_snapshots" DROP CONSTRAINT IF EXISTS "analytics_snapshots_farm_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "consent_records" DROP CONSTRAINT IF EXISTS "consent_records_user_id_fkey";

-- DropForeignKey
ALTER TABLE "farm_members" DROP CONSTRAINT IF EXISTS "farm_members_farm_id_fkey";

-- DropForeignKey
ALTER TABLE "farm_members" DROP CONSTRAINT IF EXISTS "farm_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "farmer_profiles" DROP CONSTRAINT IF EXISTS "farmer_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "farms" DROP CONSTRAINT IF EXISTS "farms_owner_user_id_fkey";

-- DropForeignKey
ALTER TABLE "fields" DROP CONSTRAINT IF EXISTS "fields_farm_id_fkey";

-- DropForeignKey
ALTER TABLE "knowledge_chunks" DROP CONSTRAINT IF EXISTS "knowledge_chunks_source_id_fkey";

-- DropForeignKey
ALTER TABLE "operation_jobs" DROP CONSTRAINT IF EXISTS "operation_jobs_field_id_fkey";

-- DropForeignKey
ALTER TABLE "operation_jobs" DROP CONSTRAINT IF EXISTS "operation_jobs_tractor_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "support_contacts" DROP CONSTRAINT IF EXISTS "support_contacts_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_assigned_to_user_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_farm_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_field_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_job_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_tractor_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_user_id_fkey";

-- DropForeignKey
ALTER TABLE "telemetry_points" DROP CONSTRAINT IF EXISTS "telemetry_points_job_id_fkey";

-- DropForeignKey
ALTER TABLE "telemetry_points" DROP CONSTRAINT IF EXISTS "telemetry_points_tractor_id_fkey";

-- DropForeignKey
ALTER TABLE "tractors" DROP CONSTRAINT IF EXISTS "tractors_farm_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "agri_docs_fts_idx";
DROP INDEX IF EXISTS "analytics_snapshots_farm_id_period_start_idx";
DROP INDEX IF EXISTS "farmer_profiles_user_id_key";
DROP INDEX IF EXISTS "knowledge_chunks_embedding_idx";
DROP INDEX IF EXISTS "telemetry_points_recorded_at_job_id_idx";

-- AlterTable
ALTER TABLE "advisory_logs" DROP CONSTRAINT IF EXISTS "advisory_logs_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN IF EXISTS "farm_id",
ADD COLUMN     "farm_id" UUID,
ADD CONSTRAINT "advisory_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "agri_docs" DROP COLUMN IF EXISTS "fts_doc";

-- AlterTable
ALTER TABLE "analytics_snapshots" DROP CONSTRAINT IF EXISTS "analytics_snapshots_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "farm_id",
ADD COLUMN     "farm_id" UUID NOT NULL,
ADD CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "actor_user_id",
ADD COLUMN     "actor_user_id" UUID,
ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "consent_records" DROP CONSTRAINT IF EXISTS "consent_records_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "farm_members" DROP CONSTRAINT IF EXISTS "farm_members_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "farm_id",
ADD COLUMN     "farm_id" UUID NOT NULL,
DROP COLUMN IF EXISTS "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "farm_members_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "farmer_profiles" DROP CONSTRAINT IF EXISTS "farmer_profiles_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "farmer_profiles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "farms" DROP CONSTRAINT IF EXISTS "farms_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "owner_user_id",
ADD COLUMN     "owner_user_id" UUID NOT NULL,
ADD CONSTRAINT "farms_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "fields" DROP CONSTRAINT IF EXISTS "fields_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "farm_id",
ADD COLUMN     "farm_id" UUID NOT NULL,
ADD CONSTRAINT "fields_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "knowledge_chunks" DROP CONSTRAINT IF EXISTS "knowledge_chunks_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "source_id",
ADD COLUMN     "source_id" UUID NOT NULL,
ADD CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "knowledge_sources" DROP CONSTRAINT IF EXISTS "knowledge_sources_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ADD CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "operation_jobs" DROP CONSTRAINT IF EXISTS "operation_jobs_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "tractor_id",
ADD COLUMN     "tractor_id" UUID NOT NULL,
DROP COLUMN IF EXISTS "field_id",
ADD COLUMN     "field_id" UUID NOT NULL,
ADD CONSTRAINT "operation_jobs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "support_contacts" DROP CONSTRAINT IF EXISTS "support_contacts_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "organization_id",
ADD COLUMN     "organization_id" UUID NOT NULL,
ADD CONSTRAINT "support_contacts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "support_organizations" DROP CONSTRAINT IF EXISTS "support_organizations_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "support_organizations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN IF EXISTS "farm_id",
ADD COLUMN     "farm_id" UUID,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "priority" DROP NOT NULL,
ALTER COLUMN "priority" DROP DEFAULT,
DROP COLUMN IF EXISTS "assigned_to_user_id",
ADD COLUMN     "assigned_to_user_id" UUID,
DROP COLUMN IF EXISTS "field_id",
ADD COLUMN     "field_id" UUID,
DROP COLUMN IF EXISTS "tractor_id",
ADD COLUMN     "tractor_id" UUID,
DROP COLUMN IF EXISTS "job_id",
ADD COLUMN     "job_id" UUID,
ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "telemetry_points" DROP COLUMN IF EXISTS "tractor_id",
ADD COLUMN     "tractor_id" UUID NOT NULL,
DROP COLUMN IF EXISTS "job_id",
ADD COLUMN     "job_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "tractors" DROP CONSTRAINT IF EXISTS "tractors_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN IF EXISTS "farm_id",
ADD COLUMN     "farm_id" UUID NOT NULL,
ADD CONSTRAINT "tractors_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_pkey",
DROP COLUMN IF EXISTS "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "analytics_snapshots_farm_id_period_start_idx" ON "analytics_snapshots"("farm_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "farmer_profiles_user_id_key" ON "farmer_profiles"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "knowledge_chunks_embedding_idx" ON "knowledge_chunks"("embedding");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "telemetry_points_recorded_at_job_id_idx" ON "telemetry_points"("recorded_at", "job_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tractors" ADD CONSTRAINT "tractors_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_jobs" ADD CONSTRAINT "operation_jobs_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_jobs" ADD CONSTRAINT "operation_jobs_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "tractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_points" ADD CONSTRAINT "telemetry_points_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "operation_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_points" ADD CONSTRAINT "telemetry_points_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "tractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_contacts" ADD CONSTRAINT "support_contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "support_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "operation_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "tractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_logs" ADD CONSTRAINT "advisory_logs_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_logs" ADD CONSTRAINT "advisory_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
