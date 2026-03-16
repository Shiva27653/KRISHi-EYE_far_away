-- Migration recovery for fts

-- DropForeignKey
ALTER TABLE "advisory_logs" DROP CONSTRAINT "advisory_logs_farm_id_fkey";

-- DropForeignKey
ALTER TABLE "advisory_logs" DROP CONSTRAINT "advisory_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "analytics_snapshots" DROP CONSTRAINT "analytics_snapshots_farm_id_fkey";

-- DropForeignKey
ALTER TABLE "consent_records" DROP CONSTRAINT "consent_records_user_id_fkey";

-- DropForeignKey
ALTER TABLE "farm_members" DROP CONSTRAINT "farm_members_farm_id_fkey";

-- DropForeignKey
ALTER TABLE "farm_members" DROP CONSTRAINT "farm_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "farmer_profiles" DROP CONSTRAINT "farmer_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "farms" DROP CONSTRAINT "farms_owner_user_id_fkey";

-- DropForeignKey
ALTER TABLE "fields" DROP CONSTRAINT "fields_farm_id_fkey";

-- DropForeignKey
ALTER TABLE "knowledge_chunks" DROP CONSTRAINT "knowledge_chunks_source_id_fkey";

-- DropForeignKey
ALTER TABLE "operation_jobs" DROP CONSTRAINT "operation_jobs_field_id_fkey";

-- DropForeignKey
ALTER TABLE "operation_jobs" DROP CONSTRAINT "operation_jobs_tractor_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "support_contacts" DROP CONSTRAINT "support_contacts_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_farm_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_field_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_job_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_tractor_id_fkey";

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_user_id_fkey";

-- DropForeignKey
ALTER TABLE "telemetry_points" DROP CONSTRAINT "telemetry_points_job_id_fkey";

-- DropForeignKey
ALTER TABLE "telemetry_points" DROP CONSTRAINT "telemetry_points_tractor_id_fkey";

-- DropForeignKey
ALTER TABLE "tractors" DROP CONSTRAINT "tractors_farm_id_fkey";

-- DropIndex
DROP INDEX "knowledge_chunks_embedding_idx";

-- AlterTable
ALTER TABLE "advisory_logs" DROP CONSTRAINT "advisory_logs_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "farm_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "advisory_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "analytics_snapshots" DROP CONSTRAINT "analytics_snapshots_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "farm_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "actor_user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "consent_records" DROP CONSTRAINT "consent_records_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "farm_members" DROP CONSTRAINT "farm_members_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "farm_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "farm_members_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "farmer_profiles" DROP CONSTRAINT "farmer_profiles_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "farmer_profiles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "farms" DROP CONSTRAINT "farms_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "owner_user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "farms_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "fields" DROP CONSTRAINT "fields_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "farm_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "fields_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "knowledge_chunks" DROP CONSTRAINT "knowledge_chunks_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "source_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "knowledge_sources" DROP CONSTRAINT "knowledge_sources_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET NOT NULL,
ADD CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "operation_jobs" DROP CONSTRAINT "operation_jobs_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tractor_id" SET DATA TYPE TEXT,
ALTER COLUMN "field_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "operation_jobs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "support_contacts" DROP CONSTRAINT "support_contacts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "organization_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "support_contacts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "support_organizations" DROP CONSTRAINT "support_organizations_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "support_organizations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "farm_id" SET DATA TYPE TEXT,
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'open',
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "priority" SET DEFAULT 'medium',
ALTER COLUMN "assigned_to_user_id" SET DATA TYPE TEXT,
ALTER COLUMN "field_id" SET DATA TYPE TEXT,
ALTER COLUMN "tractor_id" SET DATA TYPE TEXT,
ALTER COLUMN "job_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "telemetry_points" ALTER COLUMN "tractor_id" SET DATA TYPE TEXT,
ALTER COLUMN "job_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "tractors" DROP CONSTRAINT "tractors_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "farm_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "tractors_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "agri_docs" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "crop" TEXT,
    "state" TEXT,
    "district" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "source_dataset" TEXT,
    "source_file" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agri_docs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agri_docs_crop_state_language_idx" ON "agri_docs"("crop", "state", "language");

-- CreateIndex
CREATE INDEX "agri_docs_source_dataset_idx" ON "agri_docs"("source_dataset");

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
ALTER TABLE "operation_jobs" ADD CONSTRAINT "operation_jobs_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "tractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_jobs" ADD CONSTRAINT "operation_jobs_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_points" ADD CONSTRAINT "telemetry_points_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "tractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_points" ADD CONSTRAINT "telemetry_points_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "operation_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_contacts" ADD CONSTRAINT "support_contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "support_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "tractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "operation_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_logs" ADD CONSTRAINT "advisory_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_logs" ADD CONSTRAINT "advisory_logs_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create Full-Text Search index for AgriDoc
-- This creates a gin index on a generated tsvector column for title and content
-- and combines them with different weights (A for title, B for content)

ALTER TABLE "agri_docs" ADD COLUMN "fts_doc" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
) STORED;

CREATE INDEX "agri_docs_fts_idx" ON "agri_docs" USING GIN ("fts_doc");
