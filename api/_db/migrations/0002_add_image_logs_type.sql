-- Rename image_generations table to image_logs
ALTER TABLE "image_generations" RENAME TO "image_logs";

-- Add type column with default value
ALTER TABLE "image_logs" ADD COLUMN "type" varchar(50) NOT NULL DEFAULT 'image_generation';

-- Drop old index
DROP INDEX IF EXISTS "user_created_idx";

-- Create new index that includes type
CREATE INDEX "user_type_created_idx" ON "image_logs" USING btree ("user_id","type","created_at");

