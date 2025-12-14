-- Add additional metadata columns to feed_posts table for maximum article data extraction
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "author" text;
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "creator" text;
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "categories" jsonb;
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "media_url" text;
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "media_thumbnail" text;
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "media_type" varchar(100);
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "enclosure_url" text;
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "enclosure_type" varchar(100);
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "enclosure_length" varchar(50);
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "duration" varchar(50);
ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "comments_url" text;

-- Add additional metadata columns to feeds table for feed-level information
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "copyright" text;
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "generator" varchar(255);
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "managing_editor" varchar(255);
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "web_master" varchar(255);
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "ttl" integer;
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "update_period" varchar(50);
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "update_frequency" integer;
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "itunes_author" varchar(255);
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "itunes_category" varchar(255);
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "itunes_explicit" boolean;
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "last_build_date" timestamp with time zone;
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "feed_pub_date" timestamp with time zone;

-- Add index for author searches
CREATE INDEX IF NOT EXISTS "idx_feed_posts_author" ON "feed_posts" ("author");
