# FeedPulse: Database Schema

## Overview

This document defines the PostgreSQL database schema for FeedPulse, including pgvector extension for similarity search capabilities.

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Tables

### users

Stores user accounts and profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| display_name | VARCHAR(100) | NOT NULL | Public display name |
| avatar_url | TEXT | | Profile avatar URL |
| bio | TEXT | | User biography/description |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'user' | Role: 'user', 'contributor', 'admin' |
| points | INTEGER | NOT NULL, DEFAULT 0 | Gamification score |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_role` on `role`
- `idx_users_points` on `points DESC`

---

### categories

Hierarchical category taxonomy for feed classification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Category name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly identifier |
| description | TEXT | | Category description |
| parent_id | UUID | REFERENCES categories(id) | Parent category for hierarchy |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_categories_slug` on `slug`
- `idx_categories_parent` on `parent_id`

---

### feeds

Core feed registry with metadata and LLM-generated analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| url | TEXT | UNIQUE, NOT NULL | RSS feed URL |
| title | VARCHAR(255) | | Feed title |
| title_source | VARCHAR(20) | DEFAULT 'llm' | Source: 'llm', 'user', 'admin' |
| description | TEXT | | Feed description |
| description_source | VARCHAR(20) | DEFAULT 'llm' | Source: 'llm', 'user', 'admin' |
| site_url | TEXT | | Associated website URL |
| language | VARCHAR(10) | | Feed language code (e.g., 'en') |
| content_type | VARCHAR(50) | | Primary content type (blog, news, podcast, etc.) |
| posting_frequency | VARCHAR(50) | | Frequency pattern (daily, weekly, etc.) |
| posts_per_week | DECIMAL(5,2) | | Average posts per week |
| last_post_at | TIMESTAMPTZ | | Most recent post timestamp |
| last_fetched_at | TIMESTAMPTZ | | Last successful fetch |
| last_analyzed_at | TIMESTAMPTZ | | Last LLM analysis |
| use_readability | BOOLEAN | DEFAULT NULL | Override global readability setting |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Status: 'pending', 'active', 'inactive', 'rejected' |
| rejection_reason | TEXT | | Reason for rejection (if status = 'rejected') |
| consecutive_failures | INTEGER | NOT NULL, DEFAULT 0 | Consecutive fetch failures count |
| embedding | VECTOR(1536) | | text-embedding-3-small vector |
| submitted_by | UUID | REFERENCES users(id) | User who submitted the feed |
| approved_by | UUID | REFERENCES users(id) | Admin who approved |
| approved_at | TIMESTAMPTZ | | Approval timestamp |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_feeds_url` on `url`
- `idx_feeds_status` on `status`
- `idx_feeds_submitted_by` on `submitted_by`
- `idx_feeds_embedding` using ivfflat on `embedding vector_cosine_ops`

---

### feed_categories

Many-to-many relationship between feeds and categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| feed_id | UUID | NOT NULL, REFERENCES feeds(id) ON DELETE CASCADE | Feed reference |
| category_id | UUID | NOT NULL, REFERENCES categories(id) ON DELETE CASCADE | Category reference |
| source | VARCHAR(20) | DEFAULT 'llm' | Source: 'llm', 'user', 'admin' |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Assignment timestamp |

**Primary Key:** `(feed_id, category_id)`

**Indexes:**
- `idx_feed_categories_feed` on `feed_id`
- `idx_feed_categories_category` on `category_id`

---

### feed_posts

Cached feed entries for analysis and statistics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| feed_id | UUID | NOT NULL, REFERENCES feeds(id) ON DELETE CASCADE | Parent feed |
| guid | TEXT | NOT NULL | Post unique identifier from feed |
| title | TEXT | | Post title |
| link | TEXT | | Post URL |
| content | TEXT | | Post content (excerpt or full) |
| full_content | TEXT | | Full content via Readability |
| published_at | TIMESTAMPTZ | | Publication timestamp |
| fetched_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When post was fetched |

**Unique Constraint:** `(feed_id, guid)`

**Indexes:**
- `idx_feed_posts_feed` on `feed_id`
- `idx_feed_posts_published` on `published_at DESC`

---

### feed_statistics

Historical statistics snapshots for feeds (weekly/monthly aggregates).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| feed_id | UUID | NOT NULL, REFERENCES feeds(id) ON DELETE CASCADE | Feed reference |
| period_start | DATE | NOT NULL | Statistics period start |
| period_end | DATE | NOT NULL | Statistics period end |
| post_count | INTEGER | NOT NULL, DEFAULT 0 | Posts in period |
| avg_post_length | INTEGER | | Average post length (chars) |
| content_types | JSONB | | Content type distribution |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Snapshot timestamp |

**Unique Constraint:** `(feed_id, period_start, period_end)`

**Indexes:**
- `idx_feed_statistics_feed` on `feed_id`
- `idx_feed_statistics_period` on `period_start, period_end`

---

### feed_daily_stats

Daily post counts for granular historical tracking and trend analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| feed_id | UUID | NOT NULL, REFERENCES feeds(id) ON DELETE CASCADE | Feed reference |
| date | DATE | NOT NULL | The specific date |
| post_count | INTEGER | NOT NULL, DEFAULT 0 | Number of posts on this date |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Unique Constraint:** `(feed_id, date)`

**Indexes:**
- `idx_feed_daily_stats_feed` on `feed_id`
- `idx_feed_daily_stats_date` on `date DESC`
- `idx_feed_daily_stats_feed_date` on `feed_id, date DESC`

---

### votes

User votes on feeds (upvote/downvote).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| feed_id | UUID | NOT NULL, REFERENCES feeds(id) ON DELETE CASCADE | Voted feed |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Voting user |
| value | SMALLINT | NOT NULL, CHECK (value IN (-1, 1)) | Vote: 1 (up), -1 (down) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vote timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last change timestamp |

**Unique Constraint:** `(feed_id, user_id)`

**Indexes:**
- `idx_votes_feed` on `feed_id`
- `idx_votes_user` on `user_id`

---

### comments

User comments on feeds.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| feed_id | UUID | NOT NULL, REFERENCES feeds(id) ON DELETE CASCADE | Commented feed |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Comment author |
| content | TEXT | NOT NULL | Comment text |
| parent_id | UUID | REFERENCES comments(id) ON DELETE CASCADE | Parent comment for replies |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last edit timestamp |

**Indexes:**
- `idx_comments_feed` on `feed_id`
- `idx_comments_user` on `user_id`
- `idx_comments_parent` on `parent_id`

---

### proposals

Community proposals for feed edits or feature changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| feed_id | UUID | REFERENCES feeds(id) ON DELETE CASCADE | Target feed (null for feature proposals) |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Proposing user |
| type | VARCHAR(50) | NOT NULL | Type: 'edit', 'feature', 'removal' |
| title | VARCHAR(255) | NOT NULL | Proposal title |
| description | TEXT | NOT NULL | Detailed description |
| changes | JSONB | | Proposed field changes |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'open' | Status: 'open', 'approved', 'rejected', 'implemented' |
| votes_for | INTEGER | NOT NULL, DEFAULT 0 | Approval votes count |
| votes_against | INTEGER | NOT NULL, DEFAULT 0 | Rejection votes count |
| reviewed_by | UUID | REFERENCES users(id) | Admin reviewer |
| reviewed_at | TIMESTAMPTZ | | Review timestamp |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_proposals_feed` on `feed_id`
- `idx_proposals_user` on `user_id`
- `idx_proposals_status` on `status`
- `idx_proposals_type` on `type`

---

### proposal_votes

Community votes on proposals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| proposal_id | UUID | NOT NULL, REFERENCES proposals(id) ON DELETE CASCADE | Target proposal |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Voting user |
| value | SMALLINT | NOT NULL, CHECK (value IN (-1, 1)) | Vote: 1 (for), -1 (against) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vote timestamp |

**Unique Constraint:** `(proposal_id, user_id)`

**Indexes:**
- `idx_proposal_votes_proposal` on `proposal_id`
- `idx_proposal_votes_user` on `user_id`

---

### point_transactions

Audit log for gamification point changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User receiving points |
| amount | INTEGER | NOT NULL | Points awarded (can be negative) |
| reason | VARCHAR(100) | NOT NULL | Reason code |
| reference_type | VARCHAR(50) | | Related entity type |
| reference_id | UUID | | Related entity ID |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Transaction timestamp |

**Indexes:**
- `idx_point_transactions_user` on `user_id`
- `idx_point_transactions_created` on `created_at DESC`

---

### settings

Global system configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | VARCHAR(100) | PRIMARY KEY | Setting key |
| value | JSONB | NOT NULL | Setting value |
| description | TEXT | | Setting description |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| updated_by | UUID | REFERENCES users(id) | Admin who updated |

---

### update_queue

Queue for scheduled and manual feed updates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| feed_id | UUID | NOT NULL, REFERENCES feeds(id) ON DELETE CASCADE | Feed to update |
| priority | INTEGER | NOT NULL, DEFAULT 0 | Processing priority |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Status: 'pending', 'processing', 'completed', 'failed' |
| triggered_by | UUID | REFERENCES users(id) | Admin who triggered (null for scheduled) |
| scheduled_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When to process |
| started_at | TIMESTAMPTZ | | Processing start time |
| completed_at | TIMESTAMPTZ | | Processing completion time |
| error_message | TEXT | | Error details if failed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Queue entry timestamp |

**Indexes:**
- `idx_update_queue_status` on `status`
- `idx_update_queue_scheduled` on `scheduled_at`
- `idx_update_queue_feed` on `feed_id`

---

### user_sessions

User authentication sessions and refresh tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Session owner |
| refresh_token_hash | VARCHAR(255) | NOT NULL | Hashed refresh token |
| user_agent | TEXT | | Browser/client user agent |
| ip_address | INET | | Client IP address |
| expires_at | TIMESTAMPTZ | NOT NULL | Session expiration |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Session creation |
| last_used_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last activity timestamp |

**Indexes:**
- `idx_user_sessions_user` on `user_id`
- `idx_user_sessions_expires` on `expires_at`

---

### user_favorites

User bookmarked/saved feeds for quick access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User reference |
| feed_id | UUID | NOT NULL, REFERENCES feeds(id) ON DELETE CASCADE | Favorited feed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When favorited |

**Primary Key:** `(user_id, feed_id)`

**Indexes:**
- `idx_user_favorites_user` on `user_id`
- `idx_user_favorites_feed` on `feed_id`

---

### tags

User-defined tags for granular feed classification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Tag name |
| slug | VARCHAR(50) | UNIQUE, NOT NULL | URL-friendly identifier |
| usage_count | INTEGER | NOT NULL, DEFAULT 0 | Number of feeds using this tag |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_tags_slug` on `slug`
- `idx_tags_usage` on `usage_count DESC`

---

### feed_tags

Many-to-many relationship between feeds and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| feed_id | UUID | NOT NULL, REFERENCES feeds(id) ON DELETE CASCADE | Feed reference |
| tag_id | UUID | NOT NULL, REFERENCES tags(id) ON DELETE CASCADE | Tag reference |
| source | VARCHAR(20) | DEFAULT 'llm' | Source: 'llm', 'user', 'admin' |
| created_by | UUID | REFERENCES users(id) | User who added the tag |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Assignment timestamp |

**Primary Key:** `(feed_id, tag_id)`

**Indexes:**
- `idx_feed_tags_feed` on `feed_id`
- `idx_feed_tags_tag` on `tag_id`

---

### feed_fetch_logs

Track feed fetch attempts and errors for health monitoring.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| feed_id | UUID | NOT NULL, REFERENCES feeds(id) ON DELETE CASCADE | Feed reference |
| success | BOOLEAN | NOT NULL | Whether fetch succeeded |
| status_code | INTEGER | | HTTP status code |
| error_type | VARCHAR(50) | | Error classification |
| error_message | TEXT | | Detailed error message |
| response_time_ms | INTEGER | | Response time in milliseconds |
| posts_found | INTEGER | | Number of posts in feed |
| new_posts | INTEGER | | Number of new posts detected |
| fetched_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Fetch timestamp |

**Indexes:**
- `idx_feed_fetch_logs_feed` on `feed_id`
- `idx_feed_fetch_logs_fetched` on `fetched_at DESC`
- `idx_feed_fetch_logs_success` on `feed_id, success`

---

### notifications

User notifications for system events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Notification recipient |
| type | VARCHAR(50) | NOT NULL | Type: 'proposal_approved', 'proposal_rejected', 'comment_reply', 'feed_approved', 'points_earned' |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | | Notification body |
| reference_type | VARCHAR(50) | | Related entity type |
| reference_id | UUID | | Related entity ID |
| read | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether notification was read |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_notifications_user` on `user_id`
- `idx_notifications_user_unread` on `user_id, read` WHERE `read = FALSE`
- `idx_notifications_created` on `created_at DESC`

---

### activity_log

Audit log for user actions and contributions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Acting user |
| action | VARCHAR(50) | NOT NULL | Action: 'feed_submit', 'feed_edit', 'vote', 'comment', 'proposal_create', 'proposal_vote' |
| entity_type | VARCHAR(50) | NOT NULL | Target entity type |
| entity_id | UUID | NOT NULL | Target entity ID |
| details | JSONB | | Additional action details |
| ip_address | INET | | Client IP address |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Action timestamp |

**Indexes:**
- `idx_activity_log_user` on `user_id`
- `idx_activity_log_entity` on `entity_type, entity_id`
- `idx_activity_log_created` on `created_at DESC`
- `idx_activity_log_action` on `action`

---

## Views

### feed_vote_summary

Aggregated vote counts per feed.

```sql
CREATE VIEW feed_vote_summary AS
SELECT 
    feed_id,
    COUNT(*) FILTER (WHERE value = 1) AS upvotes,
    COUNT(*) FILTER (WHERE value = -1) AS downvotes,
    SUM(value) AS score
FROM votes
GROUP BY feed_id;
```

### user_leaderboard

User rankings by points.

```sql
CREATE VIEW user_leaderboard AS
SELECT 
    id,
    display_name,
    avatar_url,
    points,
    RANK() OVER (ORDER BY points DESC) AS rank
FROM users
WHERE role != 'admin';
```

### user_contribution_stats

Aggregated contribution statistics per user.

```sql
CREATE VIEW user_contribution_stats AS
SELECT 
    u.id AS user_id,
    COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'active') AS feeds_submitted,
    COUNT(DISTINCT c.id) AS comments_count,
    COUNT(DISTINCT p.id) AS proposals_count,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'approved') AS proposals_approved,
    COUNT(DISTINCT v.id) AS votes_cast
FROM users u
LEFT JOIN feeds f ON f.submitted_by = u.id
LEFT JOIN comments c ON c.user_id = u.id
LEFT JOIN proposals p ON p.user_id = u.id
LEFT JOIN votes v ON v.user_id = u.id
GROUP BY u.id;
```

### feed_health_summary

Feed health status based on recent fetch attempts.

```sql
CREATE VIEW feed_health_summary AS
SELECT 
    f.id AS feed_id,
    f.url,
    f.status,
    f.consecutive_failures,
    f.last_fetched_at,
    COUNT(l.id) FILTER (WHERE l.success = TRUE AND l.fetched_at > NOW() - INTERVAL '7 days') AS successful_fetches_7d,
    COUNT(l.id) FILTER (WHERE l.success = FALSE AND l.fetched_at > NOW() - INTERVAL '7 days') AS failed_fetches_7d,
    AVG(l.response_time_ms) FILTER (WHERE l.fetched_at > NOW() - INTERVAL '7 days') AS avg_response_time_7d
FROM feeds f
LEFT JOIN feed_fetch_logs l ON l.feed_id = f.id
GROUP BY f.id, f.url, f.status, f.consecutive_failures, f.last_fetched_at;
```

### feed_history_summary

Comprehensive feed history statistics including first post, total posts, and activity metrics.

```sql
CREATE VIEW feed_history_summary AS
SELECT 
    f.id AS feed_id,
    f.url,
    f.title,
    MIN(p.published_at) AS first_post_at,
    MAX(p.published_at) AS last_post_at,
    COUNT(p.id) AS total_posts,
    COUNT(DISTINCT DATE(p.published_at)) AS active_days,
    EXTRACT(DAY FROM (MAX(p.published_at) - MIN(p.published_at))) AS days_active,
    CASE 
        WHEN COUNT(DISTINCT DATE(p.published_at)) > 0 
        THEN ROUND(COUNT(p.id)::DECIMAL / COUNT(DISTINCT DATE(p.published_at)), 2)
        ELSE 0 
    END AS avg_posts_per_active_day,
    CASE 
        WHEN EXTRACT(DAY FROM (MAX(p.published_at) - MIN(p.published_at))) > 0 
        THEN ROUND(COUNT(p.id)::DECIMAL / (EXTRACT(DAY FROM (MAX(p.published_at) - MIN(p.published_at))) / 7), 2)
        ELSE 0 
    END AS avg_posts_per_week,
    COUNT(p.id) FILTER (WHERE p.published_at > NOW() - INTERVAL '7 days') AS posts_last_7d,
    COUNT(p.id) FILTER (WHERE p.published_at > NOW() - INTERVAL '30 days') AS posts_last_30d,
    COUNT(p.id) FILTER (WHERE p.published_at > NOW() - INTERVAL '90 days') AS posts_last_90d
FROM feeds f
LEFT JOIN feed_posts p ON p.feed_id = f.id
GROUP BY f.id, f.url, f.title;
```

### feed_daily_activity

Daily post counts aggregated from feed_posts for charting.

```sql
CREATE VIEW feed_daily_activity AS
SELECT 
    feed_id,
    DATE(published_at) AS date,
    COUNT(*) AS post_count
FROM feed_posts
WHERE published_at IS NOT NULL
GROUP BY feed_id, DATE(published_at)
ORDER BY feed_id, date DESC;
```

---

## Point Values

| Action | Points |
|--------|--------|
| Submit new feed (approved) | +10 |
| Submit unique feed (first in DB) | +25 |
| Helpful comment (upvoted) | +2 |
| Approved edit proposal | +5 |
| Approved feature proposal | +15 |
| Downvoted comment | -1 |
| Rejected submission | -2 |

---

## Notes

- **Data Precedence**: `*_source` columns track whether data came from LLM, user submission, or admin override
- **Vector Search**: `embedding` column uses pgvector for similarity matching with `text-embedding-3-small` (1536 dimensions)
- **Soft Deletes**: Consider adding `deleted_at` columns if soft delete functionality is needed
- **Audit Trail**: `point_transactions` provides full history of gamification changes
