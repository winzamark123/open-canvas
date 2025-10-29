ALTER TABLE "image_generations" RENAME TO "image_logs";--> statement-breakpoint
ALTER TABLE "image_logs" DROP CONSTRAINT "image_generations_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "user_created_idx";--> statement-breakpoint
ALTER TABLE "image_logs" ADD COLUMN "type" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "image_logs" ADD CONSTRAINT "image_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_type_created_idx" ON "image_logs" USING btree ("user_id","type","created_at");