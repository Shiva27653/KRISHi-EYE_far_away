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

-- Create Full-Text Search index for AgriDoc
-- This creates a gin index on a generated tsvector column for title and content
-- and combines them with different weights (A for title, B for content)

ALTER TABLE "agri_docs" ADD COLUMN "fts_doc" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
) STORED;

CREATE INDEX "agri_docs_fts_idx" ON "agri_docs" USING GIN ("fts_doc");
