import { db } from '../db/index.js';
import { feedPosts, feedAnalytics, feedDailyStats } from '../db/schema/index.js';
import { eq, desc, lt, sql } from 'drizzle-orm';

export interface FeedAnalyticsResult {
  totalPosts: number;
  postsWithContent: number;
  postsWithFullContent: number;
  uniqueAuthors: number;
  postsWithAuthor: number;
  topAuthors: { name: string; count: number }[];
  uniqueCategories: number;
  postsWithCategories: number;
  topCategories: { name: string; count: number }[];
  postsWithMedia: number;
  postsWithThumbnail: number;
  postsWithEnclosure: number;
  mediaTypes: { type: string; count: number }[];
  postsWithDuration: number;
  avgDurationSeconds: number | null;
  totalDurationSeconds: number | null;
  postsWithComments: number;
  avgContentLength: number | null;
  avgTitleLength: number | null;
  hasAuthors: boolean;
  hasCategories: boolean;
  hasMedia: boolean;
  hasThumbnails: boolean;
  hasEnclosures: boolean;
  hasDurations: boolean;
  hasFullContent: boolean;
  isPodcast: boolean;
  oldestPostDate: Date | null;
  newestPostDate: Date | null;
}

/**
 * Parse duration string (HH:MM:SS or MM:SS) to seconds
 */
function parseDurationToSeconds(duration: string | null | undefined): number | null {
  if (!duration) return null;
  
  const parts = duration.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  
  return null;
}

/**
 * Compute analytics for a feed based on its posts
 */
export async function computeFeedAnalytics(feedId: string): Promise<FeedAnalyticsResult> {
  // Get all posts for this feed
  const posts = await db.query.feedPosts.findMany({
    where: eq(feedPosts.feedId, feedId),
    orderBy: [desc(feedPosts.publishedAt)],
  });
  
  const totalPosts = posts.length;
  
  if (totalPosts === 0) {
    return {
      totalPosts: 0,
      postsWithContent: 0,
      postsWithFullContent: 0,
      uniqueAuthors: 0,
      postsWithAuthor: 0,
      topAuthors: [],
      uniqueCategories: 0,
      postsWithCategories: 0,
      topCategories: [],
      postsWithMedia: 0,
      postsWithThumbnail: 0,
      postsWithEnclosure: 0,
      mediaTypes: [],
      postsWithDuration: 0,
      avgDurationSeconds: null,
      totalDurationSeconds: null,
      postsWithComments: 0,
      avgContentLength: null,
      avgTitleLength: null,
      hasAuthors: false,
      hasCategories: false,
      hasMedia: false,
      hasThumbnails: false,
      hasEnclosures: false,
      hasDurations: false,
      hasFullContent: false,
      isPodcast: false,
      oldestPostDate: null,
      newestPostDate: null,
    };
  }
  
  // Count posts with content
  const postsWithContent = posts.filter(p => p.content && p.content.length > 0).length;
  const postsWithFullContent = posts.filter(p => p.fullContent && p.fullContent.length > 0).length;
  
  // Author statistics
  const authorCounts = new Map<string, number>();
  let postsWithAuthor = 0;
  
  for (const post of posts) {
    const author = post.author || post.creator;
    if (author) {
      postsWithAuthor++;
      authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
    }
  }
  
  const topAuthors = Array.from(authorCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Category statistics
  const categoryCounts = new Map<string, number>();
  let postsWithCategories = 0;
  
  for (const post of posts) {
    if (post.categories && Array.isArray(post.categories) && post.categories.length > 0) {
      postsWithCategories++;
      for (const cat of post.categories) {
        if (typeof cat === 'string') {
          // Split comma-separated categories and trim whitespace
          const splitCategories = cat.split(',').map(c => c.trim()).filter(c => c.length > 0);
          for (const splitCat of splitCategories) {
            categoryCounts.set(splitCat, (categoryCounts.get(splitCat) || 0) + 1);
          }
        }
      }
    }
  }
  
  const topCategories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Media statistics
  const mediaTypeCounts = new Map<string, number>();
  let postsWithMedia = 0;
  let postsWithThumbnail = 0;
  let postsWithEnclosure = 0;
  
  for (const post of posts) {
    if (post.mediaUrl) {
      postsWithMedia++;
      if (post.mediaType) {
        mediaTypeCounts.set(post.mediaType, (mediaTypeCounts.get(post.mediaType) || 0) + 1);
      }
    }
    if (post.mediaThumbnail) {
      postsWithThumbnail++;
    }
    if (post.enclosureUrl) {
      postsWithEnclosure++;
      if (post.enclosureType) {
        mediaTypeCounts.set(post.enclosureType, (mediaTypeCounts.get(post.enclosureType) || 0) + 1);
      }
    }
  }
  
  const mediaTypes = Array.from(mediaTypeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Duration statistics (for podcasts)
  let postsWithDuration = 0;
  let totalDurationSeconds = 0;
  
  for (const post of posts) {
    if (post.duration) {
      const seconds = parseDurationToSeconds(post.duration);
      if (seconds !== null) {
        postsWithDuration++;
        totalDurationSeconds += seconds;
      }
    }
  }
  
  const avgDurationSeconds = postsWithDuration > 0 
    ? Math.round(totalDurationSeconds / postsWithDuration) 
    : null;
  
  // Comments statistics
  const postsWithComments = posts.filter(p => p.commentsUrl).length;
  
  // Content length statistics
  const contentLengths = posts
    .map(p => (p.content || '').length)
    .filter(len => len > 0);
  const avgContentLength = contentLengths.length > 0
    ? Math.round(contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length)
    : null;
  
  const titleLengths = posts
    .map(p => (p.title || '').length)
    .filter(len => len > 0);
  const avgTitleLength = titleLengths.length > 0
    ? Math.round(titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length)
    : null;
  
  // Date range
  const datesWithValues = posts
    .filter(p => p.publishedAt)
    .map(p => p.publishedAt as Date);
  
  const oldestPostDate = datesWithValues.length > 0
    ? new Date(Math.min(...datesWithValues.map(d => d.getTime())))
    : null;
  const newestPostDate = datesWithValues.length > 0
    ? new Date(Math.max(...datesWithValues.map(d => d.getTime())))
    : null;
  
  // Feature flags
  const hasAuthors = postsWithAuthor > 0;
  const hasCategories = postsWithCategories > 0;
  const hasMedia = postsWithMedia > 0;
  const hasThumbnails = postsWithThumbnail > 0;
  const hasEnclosures = postsWithEnclosure > 0;
  const hasDurations = postsWithDuration > 0;
  const hasFullContent = postsWithFullContent > 0;
  
  // Determine if it's a podcast (has enclosures with audio/video and durations)
  const isPodcast = hasEnclosures && hasDurations && 
    mediaTypes.some(m => m.type.startsWith('audio/') || m.type.startsWith('video/'));
  
  return {
    totalPosts,
    postsWithContent,
    postsWithFullContent,
    uniqueAuthors: authorCounts.size,
    postsWithAuthor,
    topAuthors,
    uniqueCategories: categoryCounts.size,
    postsWithCategories,
    topCategories,
    postsWithMedia,
    postsWithThumbnail,
    postsWithEnclosure,
    mediaTypes,
    postsWithDuration,
    avgDurationSeconds,
    totalDurationSeconds: totalDurationSeconds > 0 ? totalDurationSeconds : null,
    postsWithComments,
    avgContentLength,
    avgTitleLength,
    hasAuthors,
    hasCategories,
    hasMedia,
    hasThumbnails,
    hasEnclosures,
    hasDurations,
    hasFullContent,
    isPodcast,
    oldestPostDate,
    newestPostDate,
  };
}

/**
 * Update feed analytics in the database
 */
export async function updateFeedAnalytics(feedId: string): Promise<void> {
  const analytics = await computeFeedAnalytics(feedId);
  
  await db
    .insert(feedAnalytics)
    .values({
      feedId,
      ...analytics,
      analyzedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: feedAnalytics.feedId,
      set: {
        ...analytics,
        analyzedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  
  console.log(`[Analytics] Updated analytics for feed ${feedId}: ${analytics.totalPosts} posts, ${analytics.uniqueAuthors} authors, ${analytics.uniqueCategories} categories`);
}

/**
 * Get feed analytics from the database
 */
export async function getFeedAnalytics(feedId: string) {
  return db.query.feedAnalytics.findFirst({
    where: eq(feedAnalytics.feedId, feedId),
  });
}

/**
 * Regenerate daily stats for a feed based on actual post publishedAt dates.
 * This ensures the daily stats reflect the true posting activity, not just
 * when posts were discovered/inserted.
 */
export async function regenerateDailyStats(feedId: string): Promise<{ daysUpdated: number; totalPosts: number }> {
  // Get all posts with publishedAt dates
  const posts = await db.query.feedPosts.findMany({
    where: eq(feedPosts.feedId, feedId),
    columns: { publishedAt: true },
  });
  
  // Group posts by date
  const postsByDate = new Map<string, number>();
  
  for (const post of posts) {
    if (post.publishedAt) {
      const dateStr = new Date(post.publishedAt).toISOString().split('T')[0];
      postsByDate.set(dateStr, (postsByDate.get(dateStr) || 0) + 1);
    }
  }
  
  if (postsByDate.size === 0) {
    console.log(`[DailyStats] No posts with dates found for feed ${feedId}`);
    return { daysUpdated: 0, totalPosts: 0 };
  }
  
  // Delete existing daily stats for this feed
  await db.delete(feedDailyStats).where(eq(feedDailyStats.feedId, feedId));
  
  // Insert new daily stats
  const statsToInsert = Array.from(postsByDate.entries()).map(([date, postCount]) => ({
    feedId,
    date,
    postCount,
  }));
  
  await db.insert(feedDailyStats).values(statsToInsert);
  
  const totalPosts = Array.from(postsByDate.values()).reduce((sum, count) => sum + count, 0);
  
  console.log(`[DailyStats] Regenerated stats for feed ${feedId}: ${postsByDate.size} days, ${totalPosts} total posts`);
  
  return { daysUpdated: postsByDate.size, totalPosts };
}

/**
 * Regenerate daily stats for all feeds
 */
export async function regenerateAllDailyStats(): Promise<{ feedsProcessed: number; totalDays: number; totalPosts: number }> {
  // Get all unique feed IDs from feed_posts
  const feedIds = await db
    .selectDistinct({ feedId: feedPosts.feedId })
    .from(feedPosts);
  
  let totalDays = 0;
  let totalPosts = 0;
  
  for (const { feedId } of feedIds) {
    const result = await regenerateDailyStats(feedId);
    totalDays += result.daysUpdated;
    totalPosts += result.totalPosts;
  }
  
  console.log(`[DailyStats] Regenerated all stats: ${feedIds.length} feeds, ${totalDays} days, ${totalPosts} posts`);
  
  return { feedsProcessed: feedIds.length, totalDays, totalPosts };
}

/**
 * Retention policy: Delete posts older than specified days (default 365)
 * Also cleans up daily stats for deleted posts
 */
export async function cleanupOldPosts(retentionDays: number = 365): Promise<{ 
  postsDeleted: number; 
  dailyStatsDeleted: number;
  feedsAffected: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
  
  console.log(`[Cleanup] Deleting posts older than ${cutoffDateStr} (${retentionDays} days retention)`);
  
  // Get feeds that will be affected
  const affectedFeeds = await db
    .selectDistinct({ feedId: feedPosts.feedId })
    .from(feedPosts)
    .where(lt(feedPosts.publishedAt, cutoffDate));
  
  // Delete old posts
  const deleteResult = await db
    .delete(feedPosts)
    .where(lt(feedPosts.publishedAt, cutoffDate))
    .returning({ id: feedPosts.id });
  
  const postsDeleted = deleteResult.length;
  
  // Delete old daily stats
  const dailyStatsResult = await db
    .delete(feedDailyStats)
    .where(lt(feedDailyStats.date, cutoffDateStr))
    .returning({ id: feedDailyStats.id });
  
  const dailyStatsDeleted = dailyStatsResult.length;
  
  // Regenerate daily stats for affected feeds to ensure accuracy
  for (const { feedId } of affectedFeeds) {
    await regenerateDailyStats(feedId);
  }
  
  console.log(`[Cleanup] Deleted ${postsDeleted} posts, ${dailyStatsDeleted} daily stats from ${affectedFeeds.length} feeds`);
  
  return { 
    postsDeleted, 
    dailyStatsDeleted,
    feedsAffected: affectedFeeds.length,
  };
}

/**
 * Cleanup old posts for a single feed
 */
export async function cleanupOldPostsForFeed(feedId: string, retentionDays: number = 365): Promise<{
  postsDeleted: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  // Delete old posts for this feed
  const deleteResult = await db
    .delete(feedPosts)
    .where(sql`${feedPosts.feedId} = ${feedId} AND ${feedPosts.publishedAt} < ${cutoffDate}`)
    .returning({ id: feedPosts.id });
  
  const postsDeleted = deleteResult.length;
  
  if (postsDeleted > 0) {
    // Regenerate daily stats after cleanup
    await regenerateDailyStats(feedId);
    console.log(`[Cleanup] Deleted ${postsDeleted} old posts from feed ${feedId}`);
  }
  
  return { postsDeleted };
}
