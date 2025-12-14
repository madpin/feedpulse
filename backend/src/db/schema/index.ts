import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  date,
  smallint,
  jsonb,
  inet,
  primaryKey,
  unique,
  index,
  check,
  customType,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Custom vector type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    return `vector(${(config as { dimensions: number }).dimensions})`;
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

// ============================================
// USERS
// ============================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  points: integer('points').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_users_email').on(table.email),
  index('idx_users_role').on(table.role),
  index('idx_users_points').on(table.points),
]);

export const usersRelations = relations(users, ({ many }) => ({
  feeds: many(feeds, { relationName: 'submittedFeeds' }),
  approvedFeeds: many(feeds, { relationName: 'approvedFeeds' }),
  votes: many(votes),
  comments: many(comments),
  proposals: many(proposals),
  sessions: many(userSessions),
  favorites: many(userFavorites),
  notifications: many(notifications),
  pointTransactions: many(pointTransactions),
  activityLogs: many(activityLog),
}));

// ============================================
// CATEGORIES
// ============================================
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  parentId: uuid('parent_id').references((): AnyPgColumn => categories.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_categories_slug').on(table.slug),
  index('idx_categories_parent').on(table.parentId),
]);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parentChild',
  }),
  children: many(categories, { relationName: 'parentChild' }),
  feedCategories: many(feedCategories),
}));

// ============================================
// FEEDS
// ============================================
export const feeds = pgTable('feeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').unique().notNull(),
  title: varchar('title', { length: 255 }),
  titleSource: varchar('title_source', { length: 20 }).default('llm'),
  description: text('description'),
  descriptionSource: varchar('description_source', { length: 20 }).default('llm'),
  siteUrl: text('site_url'),
  imageUrl: text('image_url'),
  language: varchar('language', { length: 10 }),
  contentType: varchar('content_type', { length: 50 }),
  postingFrequency: varchar('posting_frequency', { length: 50 }),
  postsPerWeek: decimal('posts_per_week', { precision: 5, scale: 2 }),
  lastPostAt: timestamp('last_post_at', { withTimezone: true }),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  lastAnalyzedAt: timestamp('last_analyzed_at', { withTimezone: true }),
  useReadability: boolean('use_readability'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  embedding: vector('embedding', { dimensions: 1536 }),
  copyright: text('copyright'),
  generator: varchar('generator', { length: 255 }),
  managingEditor: varchar('managing_editor', { length: 255 }),
  webMaster: varchar('web_master', { length: 255 }),
  ttl: integer('ttl'),
  updatePeriod: varchar('update_period', { length: 50 }),
  updateFrequency: integer('update_frequency'),
  itunesAuthor: varchar('itunes_author', { length: 255 }),
  itunesCategory: varchar('itunes_category', { length: 255 }),
  itunesExplicit: boolean('itunes_explicit'),
  lastBuildDate: timestamp('last_build_date', { withTimezone: true }),
  feedPubDate: timestamp('feed_pub_date', { withTimezone: true }),
  submittedBy: uuid('submitted_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_feeds_url').on(table.url),
  index('idx_feeds_status').on(table.status),
  index('idx_feeds_submitted_by').on(table.submittedBy),
]);

export const feedsRelations = relations(feeds, ({ one, many }) => ({
  submitter: one(users, {
    fields: [feeds.submittedBy],
    references: [users.id],
    relationName: 'submittedFeeds',
  }),
  approver: one(users, {
    fields: [feeds.approvedBy],
    references: [users.id],
    relationName: 'approvedFeeds',
  }),
  feedCategories: many(feedCategories),
  feedTags: many(feedTags),
  posts: many(feedPosts),
  statistics: many(feedStatistics),
  dailyStats: many(feedDailyStats),
  votes: many(votes),
  comments: many(comments),
  proposals: many(proposals),
  favorites: many(userFavorites),
  fetchLogs: many(feedFetchLogs),
  updateQueue: many(updateQueue),
  analytics: one(feedAnalytics),
}));

// ============================================
// FEED CATEGORIES (Junction)
// ============================================
export const feedCategories = pgTable('feed_categories', {
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  source: varchar('source', { length: 20 }).default('llm'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.feedId, table.categoryId] }),
  index('idx_feed_categories_feed').on(table.feedId),
  index('idx_feed_categories_category').on(table.categoryId),
]);

export const feedCategoriesRelations = relations(feedCategories, ({ one }) => ({
  feed: one(feeds, {
    fields: [feedCategories.feedId],
    references: [feeds.id],
  }),
  category: one(categories, {
    fields: [feedCategories.categoryId],
    references: [categories.id],
  }),
}));

// ============================================
// TAGS
// ============================================
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).unique().notNull(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_tags_slug').on(table.slug),
  index('idx_tags_usage').on(table.usageCount),
]);

export const tagsRelations = relations(tags, ({ many }) => ({
  feedTags: many(feedTags),
}));

// ============================================
// FEED TAGS (Junction)
// ============================================
export const feedTags = pgTable('feed_tags', {
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  source: varchar('source', { length: 20 }).default('llm'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.feedId, table.tagId] }),
  index('idx_feed_tags_feed').on(table.feedId),
  index('idx_feed_tags_tag').on(table.tagId),
]);

export const feedTagsRelations = relations(feedTags, ({ one }) => ({
  feed: one(feeds, {
    fields: [feedTags.feedId],
    references: [feeds.id],
  }),
  tag: one(tags, {
    fields: [feedTags.tagId],
    references: [tags.id],
  }),
  creator: one(users, {
    fields: [feedTags.createdBy],
    references: [users.id],
  }),
}));

// ============================================
// FEED POSTS
// ============================================
export const feedPosts = pgTable('feed_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  guid: text('guid').notNull(),
  title: text('title'),
  link: text('link'),
  content: text('content'),
  fullContent: text('full_content'),
  author: text('author'),
  creator: text('creator'),
  categories: jsonb('categories').$type<string[]>(),
  mediaUrl: text('media_url'),
  mediaThumbnail: text('media_thumbnail'),
  mediaType: varchar('media_type', { length: 100 }),
  enclosureUrl: text('enclosure_url'),
  enclosureType: varchar('enclosure_type', { length: 100 }),
  enclosureLength: varchar('enclosure_length', { length: 50 }),
  duration: varchar('duration', { length: 50 }),
  commentsUrl: text('comments_url'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.feedId, table.guid),
  index('idx_feed_posts_feed').on(table.feedId),
  index('idx_feed_posts_published').on(table.publishedAt),
  index('idx_feed_posts_author').on(table.author),
]);

export const feedPostsRelations = relations(feedPosts, ({ one }) => ({
  feed: one(feeds, {
    fields: [feedPosts.feedId],
    references: [feeds.id],
  }),
}));

// ============================================
// FEED STATISTICS
// ============================================
export const feedStatistics = pgTable('feed_statistics', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  postCount: integer('post_count').notNull().default(0),
  avgPostLength: integer('avg_post_length'),
  contentTypes: jsonb('content_types'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.feedId, table.periodStart, table.periodEnd),
  index('idx_feed_statistics_feed').on(table.feedId),
  index('idx_feed_statistics_period').on(table.periodStart, table.periodEnd),
]);

export const feedStatisticsRelations = relations(feedStatistics, ({ one }) => ({
  feed: one(feeds, {
    fields: [feedStatistics.feedId],
    references: [feeds.id],
  }),
}));

// ============================================
// FEED DAILY STATS
// ============================================
export const feedDailyStats = pgTable('feed_daily_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  postCount: integer('post_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.feedId, table.date),
  index('idx_feed_daily_stats_feed').on(table.feedId),
  index('idx_feed_daily_stats_date').on(table.date),
  index('idx_feed_daily_stats_feed_date').on(table.feedId, table.date),
]);

export const feedDailyStatsRelations = relations(feedDailyStats, ({ one }) => ({
  feed: one(feeds, {
    fields: [feedDailyStats.feedId],
    references: [feeds.id],
  }),
}));

// ============================================
// VOTES
// ============================================
export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  value: smallint('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.feedId, table.userId),
  index('idx_votes_feed').on(table.feedId),
  index('idx_votes_user').on(table.userId),
  check('vote_value_check', sql`${table.value} IN (-1, 1)`),
]);

export const votesRelations = relations(votes, ({ one }) => ({
  feed: one(feeds, {
    fields: [votes.feedId],
    references: [feeds.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

// ============================================
// COMMENTS
// ============================================
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => comments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_comments_feed').on(table.feedId),
  index('idx_comments_user').on(table.userId),
  index('idx_comments_parent').on(table.parentId),
]);

export const commentsRelations = relations(comments, ({ one, many }) => ({
  feed: one(feeds, {
    fields: [comments.feedId],
    references: [feeds.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'parentChild',
  }),
  replies: many(comments, { relationName: 'parentChild' }),
}));

// ============================================
// PROPOSALS
// ============================================
export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id').references(() => feeds.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  changes: jsonb('changes'),
  status: varchar('status', { length: 20 }).notNull().default('open'),
  votesFor: integer('votes_for').notNull().default(0),
  votesAgainst: integer('votes_against').notNull().default(0),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_proposals_feed').on(table.feedId),
  index('idx_proposals_user').on(table.userId),
  index('idx_proposals_status').on(table.status),
  index('idx_proposals_type').on(table.type),
]);

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  feed: one(feeds, {
    fields: [proposals.feedId],
    references: [feeds.id],
  }),
  user: one(users, {
    fields: [proposals.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [proposals.reviewedBy],
    references: [users.id],
  }),
  votes: many(proposalVotes),
}));

// ============================================
// PROPOSAL VOTES
// ============================================
export const proposalVotes = pgTable('proposal_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull().references(() => proposals.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  value: smallint('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.proposalId, table.userId),
  index('idx_proposal_votes_proposal').on(table.proposalId),
  index('idx_proposal_votes_user').on(table.userId),
  check('proposal_vote_value_check', sql`${table.value} IN (-1, 1)`),
]);

export const proposalVotesRelations = relations(proposalVotes, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalVotes.proposalId],
    references: [proposals.id],
  }),
  user: one(users, {
    fields: [proposalVotes.userId],
    references: [users.id],
  }),
}));

// ============================================
// POINT TRANSACTIONS
// ============================================
export const pointTransactions = pgTable('point_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  reason: varchar('reason', { length: 100 }).notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_point_transactions_user').on(table.userId),
  index('idx_point_transactions_created').on(table.createdAt),
]);

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
}));

// ============================================
// SETTINGS
// ============================================
export const settings = pgTable('settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});

export const settingsRelations = relations(settings, ({ one }) => ({
  updater: one(users, {
    fields: [settings.updatedBy],
    references: [users.id],
  }),
}));

// ============================================
// UPDATE QUEUE
// ============================================
export const updateQueue = pgTable('update_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  priority: integer('priority').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  triggeredBy: uuid('triggered_by').references(() => users.id),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_update_queue_status').on(table.status),
  index('idx_update_queue_scheduled').on(table.scheduledAt),
  index('idx_update_queue_feed').on(table.feedId),
]);

export const updateQueueRelations = relations(updateQueue, ({ one }) => ({
  feed: one(feeds, {
    fields: [updateQueue.feedId],
    references: [feeds.id],
  }),
  triggerer: one(users, {
    fields: [updateQueue.triggeredBy],
    references: [users.id],
  }),
}));

// ============================================
// USER SESSIONS
// ============================================
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
  userAgent: text('user_agent'),
  ipAddress: inet('ip_address'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_user_sessions_user').on(table.userId),
  index('idx_user_sessions_expires').on(table.expiresAt),
]);

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

// ============================================
// USER FAVORITES
// ============================================
export const userFavorites = pgTable('user_favorites', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.feedId] }),
  index('idx_user_favorites_user').on(table.userId),
  index('idx_user_favorites_feed').on(table.feedId),
]);

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  feed: one(feeds, {
    fields: [userFavorites.feedId],
    references: [feeds.id],
  }),
}));

// ============================================
// FEED FETCH LOGS
// ============================================
export const feedFetchLogs = pgTable('feed_fetch_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  success: boolean('success').notNull(),
  statusCode: integer('status_code'),
  errorType: varchar('error_type', { length: 50 }),
  errorMessage: text('error_message'),
  responseTimeMs: integer('response_time_ms'),
  postsFound: integer('posts_found'),
  newPosts: integer('new_posts'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_feed_fetch_logs_feed').on(table.feedId),
  index('idx_feed_fetch_logs_fetched').on(table.fetchedAt),
  index('idx_feed_fetch_logs_success').on(table.feedId, table.success),
]);

export const feedFetchLogsRelations = relations(feedFetchLogs, ({ one }) => ({
  feed: one(feeds, {
    fields: [feedFetchLogs.feedId],
    references: [feeds.id],
  }),
}));

// ============================================
// NOTIFICATIONS
// ============================================
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_notifications_user').on(table.userId),
  index('idx_notifications_user_unread').on(table.userId, table.read),
  index('idx_notifications_created').on(table.createdAt),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ============================================
// ACTIVITY LOG
// ============================================
export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  details: jsonb('details'),
  ipAddress: inet('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_activity_log_user').on(table.userId),
  index('idx_activity_log_entity').on(table.entityType, table.entityId),
  index('idx_activity_log_created').on(table.createdAt),
  index('idx_activity_log_action').on(table.action),
]);

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

// ============================================
// FEED ANALYTICS - Track feature usage and statistics
// ============================================
export const feedAnalytics = pgTable('feed_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }).unique(),
  
  // Post counts
  totalPosts: integer('total_posts').notNull().default(0),
  postsWithContent: integer('posts_with_content').notNull().default(0),
  postsWithFullContent: integer('posts_with_full_content').notNull().default(0),
  
  // Author statistics
  uniqueAuthors: integer('unique_authors').notNull().default(0),
  postsWithAuthor: integer('posts_with_author').notNull().default(0),
  topAuthors: jsonb('top_authors').$type<{ name: string; count: number }[]>(),
  
  // Category/Tag statistics
  uniqueCategories: integer('unique_categories').notNull().default(0),
  postsWithCategories: integer('posts_with_categories').notNull().default(0),
  topCategories: jsonb('top_categories').$type<{ name: string; count: number }[]>(),
  
  // Media statistics
  postsWithMedia: integer('posts_with_media').notNull().default(0),
  postsWithThumbnail: integer('posts_with_thumbnail').notNull().default(0),
  postsWithEnclosure: integer('posts_with_enclosure').notNull().default(0),
  mediaTypes: jsonb('media_types').$type<{ type: string; count: number }[]>(),
  
  // Podcast/Audio features
  postsWithDuration: integer('posts_with_duration').notNull().default(0),
  avgDurationSeconds: integer('avg_duration_seconds'),
  totalDurationSeconds: integer('total_duration_seconds'),
  
  // Engagement features
  postsWithComments: integer('posts_with_comments').notNull().default(0),
  
  // Content analysis
  avgContentLength: integer('avg_content_length'),
  avgTitleLength: integer('avg_title_length'),
  
  // Feature flags - what the feed supports
  hasAuthors: boolean('has_authors').notNull().default(false),
  hasCategories: boolean('has_categories').notNull().default(false),
  hasMedia: boolean('has_media').notNull().default(false),
  hasThumbnails: boolean('has_thumbnails').notNull().default(false),
  hasEnclosures: boolean('has_enclosures').notNull().default(false),
  hasDurations: boolean('has_durations').notNull().default(false),
  hasFullContent: boolean('has_full_content').notNull().default(false),
  isPodcast: boolean('is_podcast').notNull().default(false),
  
  // Date range
  oldestPostDate: timestamp('oldest_post_date', { withTimezone: true }),
  newestPostDate: timestamp('newest_post_date', { withTimezone: true }),
  
  // Timestamps
  analyzedAt: timestamp('analyzed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_feed_analytics_feed').on(table.feedId),
  index('idx_feed_analytics_analyzed').on(table.analyzedAt),
]);

export const feedAnalyticsRelations = relations(feedAnalytics, ({ one }) => ({
  feed: one(feeds, {
    fields: [feedAnalytics.feedId],
    references: [feeds.id],
  }),
}));
