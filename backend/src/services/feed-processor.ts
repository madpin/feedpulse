import { db } from '../db/index.js';
import { feeds, feedPosts, feedCategories, feedTags, categories, tags, feedFetchLogs } from '../db/schema/index.js';
import { eq, sql, and } from 'drizzle-orm';
import { parseFeed, fetchFullContent, calculatePostingFrequency } from '../lib/feed-parser.js';
import { analyzeFeed, generateFeedEmbedding } from '../lib/llm.js';
import { env } from '../config/env.js';
import { updateFeedAnalytics, regenerateDailyStats } from './feed-analytics.js';

export interface ProcessFeedResult {
  success: boolean;
  newPosts: number;
  error?: string;
}

export async function processFeed(feedId: string): Promise<ProcessFeedResult> {
  const startTime = Date.now();
  
  try {
    // Get feed
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, feedId),
    });
    
    if (!feed) {
      return { success: false, newPosts: 0, error: 'Feed not found' };
    }
    
    // Parse feed
    const parsed = await parseFeed(feed.url);
    
    // Process items
    let newPostsCount = 0;
    const now = new Date();
    
    // Process ALL items from the feed - no limits
    console.log(`[FeedProcessor] Processing ${parsed.items.length} items from feed ${feedId}`);
    
    for (const item of parsed.items) {
      // Check if post already exists
      const existing = await db.query.feedPosts.findFirst({
        where: and(eq(feedPosts.feedId, feedId), eq(feedPosts.guid, item.guid)),
      });
      
      if (existing) continue;
      
      // Fetch full content if enabled
      let fullContent: string | null = null;
      const useReadability = feed.useReadability ?? env.USE_READABILITY_DEFAULT;
      
      if (useReadability && item.link) {
        fullContent = await fetchFullContent(item.link);
      }
      
      // Insert post with all available metadata
      await db.insert(feedPosts).values({
        feedId,
        guid: item.guid,
        title: item.title,
        link: item.link,
        content: item.content || item.contentSnippet,
        fullContent,
        author: item.author,
        creator: item.creator,
        categories: item.categories,
        mediaUrl: item.mediaUrl,
        mediaThumbnail: item.mediaThumbnail,
        mediaType: item.mediaType,
        enclosureUrl: item.enclosure?.url,
        enclosureType: item.enclosure?.type,
        enclosureLength: item.enclosure?.length,
        duration: item.duration,
        commentsUrl: item.commentsUrl,
        publishedAt: item.isoDate ? new Date(item.isoDate) : null,
      });
      
      newPostsCount++;
    }
    
    // Calculate posting frequency from all available items
    const { frequency, postsPerWeek } = calculatePostingFrequency(parsed.items);
    
    // Update feed metadata with all available information
    const lastPostDate = parsed.items[0]?.isoDate 
      ? new Date(parsed.items[0].isoDate) 
      : null;
    
    // Parse feed dates if available
    const lastBuildDate = parsed.lastBuildDate ? new Date(parsed.lastBuildDate) : null;
    const feedPubDate = parsed.pubDate ? new Date(parsed.pubDate) : null;
    
    await db.update(feeds)
      .set({
        title: feed.title || parsed.title,
        description: feed.description || parsed.description,
        siteUrl: feed.siteUrl || parsed.link,
        imageUrl: feed.imageUrl || parsed.imageUrl,
        language: feed.language || parsed.language,
        postingFrequency: frequency,
        postsPerWeek: postsPerWeek.toString(),
        lastPostAt: lastPostDate,
        lastFetchedAt: now,
        consecutiveFailures: 0,
        copyright: parsed.copyright || feed.copyright,
        generator: parsed.generator || feed.generator,
        managingEditor: parsed.managingEditor || feed.managingEditor,
        webMaster: parsed.webMaster || feed.webMaster,
        ttl: parsed.ttl ?? feed.ttl,
        updatePeriod: parsed.updatePeriod || feed.updatePeriod,
        updateFrequency: parsed.updateFrequency ?? feed.updateFrequency,
        itunesAuthor: parsed.itunesAuthor || feed.itunesAuthor,
        itunesCategory: parsed.itunesCategory || feed.itunesCategory,
        itunesExplicit: parsed.itunesExplicit ?? feed.itunesExplicit,
        lastBuildDate: lastBuildDate || feed.lastBuildDate,
        feedPubDate: feedPubDate || feed.feedPubDate,
        updatedAt: now,
      })
      .where(eq(feeds.id, feedId));
    
    // Log success
    await db.insert(feedFetchLogs).values({
      feedId,
      success: true,
      responseTimeMs: Date.now() - startTime,
      postsFound: parsed.items.length,
      newPosts: newPostsCount,
    });
    
    // Regenerate daily stats from actual post dates and update analytics
    try {
      await regenerateDailyStats(feedId);
      await updateFeedAnalytics(feedId);
    } catch (analyticsError) {
      console.error(`[FeedProcessor] Failed to update analytics for feed ${feedId}:`, analyticsError);
    }
    
    return { success: true, newPosts: newPostsCount };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update failure count
    await db.update(feeds)
      .set({
        consecutiveFailures: sql`${feeds.consecutiveFailures} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(feeds.id, feedId));
    
    // Log failure
    await db.insert(feedFetchLogs).values({
      feedId,
      success: false,
      errorType: 'fetch_error',
      errorMessage,
      responseTimeMs: Date.now() - startTime,
    });
    
    return { success: false, newPosts: 0, error: errorMessage };
  }
}

export async function analyzeFeedWithLLM(feedId: string): Promise<void> {
  const feed = await db.query.feeds.findFirst({
    where: eq(feeds.id, feedId),
  });
  
  if (!feed) {
    throw new Error('Feed not found');
  }
  
  // Get recent posts
  const recentPosts = await db.query.feedPosts.findMany({
    where: eq(feedPosts.feedId, feedId),
    orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
    limit: 10,
  });
  
  // Analyze with LLM
  const analysis = await analyzeFeed(
    feed.url,
    feed.title,
    feed.description,
    recentPosts.map(p => ({
      title: p.title || '',
      content: p.content || p.fullContent || '',
    }))
  );
  
  // Update feed with analysis
  await db.update(feeds)
    .set({
      title: feed.titleSource === 'llm' ? analysis.title : feed.title,
      description: feed.descriptionSource === 'llm' ? analysis.description : feed.description,
      contentType: analysis.contentType,
      language: analysis.language,
      postingFrequency: analysis.postingFrequency,
      lastAnalyzedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(feeds.id, feedId));
  
  // Update categories
  for (const categoryName of analysis.categories) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.name, categoryName),
    });
    
    if (category) {
      await db
        .insert(feedCategories)
        .values({
          feedId,
          categoryId: category.id,
          source: 'llm',
        })
        .onConflictDoNothing();
    }
  }
  
  // Update tags
  for (const tagName of analysis.tags) {
    // Find or create tag
    let tag = await db.query.tags.findFirst({
      where: eq(tags.slug, tagName.toLowerCase().replace(/\s+/g, '-')),
    });
    
    if (!tag) {
      const [newTag] = await db.insert(tags).values({
        name: tagName,
        slug: tagName.toLowerCase().replace(/\s+/g, '-'),
      }).returning();
      tag = newTag;
    }
    
    await db
      .insert(feedTags)
      .values({
        feedId,
        tagId: tag.id,
        source: 'llm',
      })
      .onConflictDoNothing();
    
    // Update tag usage count
    await db.update(tags)
      .set({ usageCount: sql`${tags.usageCount} + 1` })
      .where(eq(tags.id, tag.id));
  }
  
  // Generate and store embedding
  const embedding = await generateFeedEmbedding(
    analysis.title,
    analysis.description,
    analysis.categories,
    analysis.tags
  );
  
  await db.update(feeds)
    .set({ embedding })
    .where(eq(feeds.id, feedId));
}
