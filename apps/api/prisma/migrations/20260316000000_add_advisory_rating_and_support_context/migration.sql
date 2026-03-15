-- AlterTable
ALTER TABLE "advisory_logs" ADD COLUMN "rating" TEXT,
ADD COLUMN "feedback" TEXT;

-- AlterTable
ALTER TABLE "support_tickets" ADD COLUMN "title" TEXT,
ADD COLUMN "field_id" UUID,
ADD COLUMN "tractor_id" UUID,
ADD COLUMN "job_id" UUID,
ADD COLUMN "resolution_summary" TEXT,
ADD COLUMN "metadata" JSONB;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "tractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "operation_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
