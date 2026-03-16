-- Create Full-Text Search index for AgriDoc
-- This creates a gin index on a generated tsvector column for title and content
-- and combines them with different weights (A for title, B for content)

ALTER TABLE "agri_docs" ADD COLUMN "fts_doc" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
) STORED;

CREATE INDEX "agri_docs_fts_idx" ON "agri_docs" USING GIN ("fts_doc");
