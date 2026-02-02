CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Post_title_trgm_idx"
  ON "Post" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Post_description_trgm_idx"
  ON "Post" USING GIN ("description" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Post_text_trgm_idx"
  ON "Post" USING GIN ("text" gin_trgm_ops);