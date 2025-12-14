-- Create feed_analytics table to track feature usage and statistics
CREATE TABLE IF NOT EXISTS "feed_analytics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "feed_id" uuid NOT NULL UNIQUE REFERENCES "feeds"("id") ON DELETE CASCADE,
  
  -- Post counts
  "total_posts" integer NOT NULL DEFAULT 0,
  "posts_with_content" integer NOT NULL DEFAULT 0,
  "posts_with_full_content" integer NOT NULL DEFAULT 0,
  
  -- Author statistics
  "unique_authors" integer NOT NULL DEFAULT 0,
  "posts_with_author" integer NOT NULL DEFAULT 0,
  "top_authors" jsonb,
  
  -- Category/Tag statistics
  "unique_categories" integer NOT NULL DEFAULT 0,
  "posts_with_categories" integer NOT NULL DEFAULT 0,
  "top_categories" jsonb,
  
  -- Media statistics
  "posts_with_media" integer NOT NULL DEFAULT 0,
  "posts_with_thumbnail" integer NOT NULL DEFAULT 0,
  "posts_with_enclosure" integer NOT NULL DEFAULT 0,
  "media_types" jsonb,
  
  -- Podcast/Audio features
  "posts_with_duration" integer NOT NULL DEFAULT 0,
  "avg_duration_seconds" integer,
  "total_duration_seconds" integer,
  
  -- Engagement features
  "posts_with_comments" integer NOT NULL DEFAULT 0,
  
  -- Content analysis
  "avg_content_length" integer,
  "avg_title_length" integer,
  
  -- Feature flags
  "has_authors" boolean NOT NULL DEFAULT false,
  "has_categories" boolean NOT NULL DEFAULT false,
  "has_media" boolean NOT NULL DEFAULT false,
  "has_thumbnails" boolean NOT NULL DEFAULT false,
  "has_enclosures" boolean NOT NULL DEFAULT false,
  "has_durations" boolean NOT NULL DEFAULT false,
  "has_full_content" boolean NOT NULL DEFAULT false,
  "is_podcast" boolean NOT NULL DEFAULT false,
  
  -- Date range
  "oldest_post_date" timestamp with time zone,
  "newest_post_date" timestamp with time zone,
  
  -- Timestamps
  "analyzed_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_feed_analytics_feed" ON "feed_analytics" ("feed_id");
CREATE INDEX IF NOT EXISTS "idx_feed_analytics_analyzed" ON "feed_analytics" ("analyzed_at");
