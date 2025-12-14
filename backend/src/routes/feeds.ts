import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { feeds, feedCategories, feedTags, votes, userFavorites, feedPosts, feedDailyStats, categories, tags, users } from '../db/schema/index.js';
import { eq, and, desc, asc, sql, ilike, or } from 'drizzle-orm';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { parseFeed, calculatePostingFrequency } from '../lib/feed-parser.js';
import { analyzeFeed } from '../lib/llm.js';
import { env } from '../config/env.js';
import { getFeedAnalytics, updateFeedAnalytics, regenerateDailyStats } from '../services/feed-analytics.js';

const feedQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'active', 'inactive', 'rejected']).optional(),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  contentType: z.string().optional(),
  sortBy: z.enum(['score', 'recent', 'posts', 'alphabetical']).default('score'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  query: z.string().optional(),
});

const submitFeedSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export async function feedRoutes(fastify: FastifyInstance) {
  // Get all feeds (with filtering)
  fastify.get('/', { preHandler: optionalAuth }, async (request) => {
    const query = feedQuerySchema.parse(request.query);
    const userId = request.user?.userId;
    
    const offset = (query.page - 1) * query.pageSize;
    
    // Build where conditions
    const conditions = [];
    if (query.status) {
      conditions.push(eq(feeds.status, query.status));
    } else {
      conditions.push(eq(feeds.status, 'active'));
    }
    
    if (query.query) {
      conditions.push(
        or(
          ilike(feeds.title, `%${query.query}%`),
          ilike(feeds.description, `%${query.query}%`)
        )
      );
    }
    
    // Filter by category - need to get feed IDs that belong to this category
    let feedIdsInCategory: string[] | null = null;
    if (query.categoryId) {
      const feedsInCategory = await db.query.feedCategories.findMany({
        where: eq(feedCategories.categoryId, query.categoryId),
        columns: { feedId: true },
      });
      feedIdsInCategory = feedsInCategory.map(fc => fc.feedId);
      
      if (feedIdsInCategory.length === 0) {
        // No feeds in this category, return empty result
        return {
          data: [],
          total: 0,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: 0,
        };
      }
    }
    
    // Filter by tag - need to get feed IDs that have this tag
    let feedIdsWithTag: string[] | null = null;
    if (query.tagId) {
      const feedsWithTag = await db.query.feedTags.findMany({
        where: eq(feedTags.tagId, query.tagId),
        columns: { feedId: true },
      });
      feedIdsWithTag = feedsWithTag.map(ft => ft.feedId);
      
      if (feedIdsWithTag.length === 0) {
        // No feeds with this tag, return empty result
        return {
          data: [],
          total: 0,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: 0,
        };
      }
    }
    
    // Combine category and tag filters
    let allowedFeedIds: string[] | null = null;
    if (feedIdsInCategory && feedIdsWithTag) {
      // Intersection of both
      allowedFeedIds = feedIdsInCategory.filter(id => feedIdsWithTag!.includes(id));
      if (allowedFeedIds.length === 0) {
        return {
          data: [],
          total: 0,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: 0,
        };
      }
    } else if (feedIdsInCategory) {
      allowedFeedIds = feedIdsInCategory;
    } else if (feedIdsWithTag) {
      allowedFeedIds = feedIdsWithTag;
    }
    
    // Add feed ID filter if we have category/tag constraints
    if (allowedFeedIds) {
      conditions.push(sql`${feeds.id} IN (${sql.join(allowedFeedIds.map(id => sql`${id}::uuid`), sql`, `)})`);
    }
    
    // Get feeds with vote counts
    const feedsWithVotes = await db
      .select({
        feed: feeds,
        upvotes: sql<number>`COALESCE(COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END), 0)::int`,
        downvotes: sql<number>`COALESCE(COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END), 0)::int`,
        score: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
      })
      .from(feeds)
      .leftJoin(votes, eq(feeds.id, votes.feedId))
      .where(and(...conditions))
      .groupBy(feeds.id)
      .orderBy(
        query.sortBy === 'score' 
          ? (query.sortOrder === 'desc' ? desc(sql`COALESCE(SUM(${votes.value}), 0)`) : asc(sql`COALESCE(SUM(${votes.value}), 0)`))
          : query.sortBy === 'recent'
          ? (query.sortOrder === 'desc' ? desc(feeds.createdAt) : asc(feeds.createdAt))
          : query.sortBy === 'posts'
          ? (query.sortOrder === 'desc' ? desc(feeds.postsPerWeek) : asc(feeds.postsPerWeek))
          : (query.sortOrder === 'desc' ? desc(feeds.title) : asc(feeds.title))
      )
      .limit(query.pageSize)
      .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(feeds)
      .where(and(...conditions));
    
    // Enrich with categories, tags, user vote, favorite status, and submitter info
    const enrichedFeeds = await Promise.all(
      feedsWithVotes.map(async ({ feed, upvotes, downvotes, score }) => {
        const [feedCats, feedTagsList, userVote, isFavorited, submitter] = await Promise.all([
          db.query.feedCategories.findMany({
            where: eq(feedCategories.feedId, feed.id),
            with: { category: true },
          }),
          db.query.feedTags.findMany({
            where: eq(feedTags.feedId, feed.id),
            with: { tag: true },
          }),
          userId
            ? db.query.votes.findFirst({
                where: and(eq(votes.feedId, feed.id), eq(votes.userId, userId)),
              })
            : null,
          userId
            ? db.query.userFavorites.findFirst({
                where: and(eq(userFavorites.feedId, feed.id), eq(userFavorites.userId, userId)),
              })
            : null,
          feed.submittedBy
            ? db.query.users.findFirst({
                where: eq(users.id, feed.submittedBy),
                columns: { id: true, displayName: true, avatarUrl: true },
              })
            : null,
        ]);
        
        return {
          ...feed,
          submittedBy: submitter ? {
            id: submitter.id,
            displayName: submitter.displayName,
            avatarUrl: submitter.avatarUrl,
          } : null,
          categories: feedCats.map(fc => fc.category),
          tags: feedTagsList.map(ft => ft.tag),
          upvotes,
          downvotes,
          score,
          userVote: userVote?.value ?? null,
          isFavorited: !!isFavorited,
        };
      })
    );
    
    return {
      data: enrichedFeeds,
      total: count,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(count / query.pageSize),
    };
  });
  
  // Get single feed
  fastify.get('/:id', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user?.userId;
    
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, id),
      with: {
        submitter: true,
        approver: true,
      },
    });
    
    if (!feed) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    // Get vote counts
    const [voteStats] = await db
      .select({
        upvotes: sql<number>`COALESCE(COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END), 0)::int`,
        downvotes: sql<number>`COALESCE(COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END), 0)::int`,
        score: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
      })
      .from(votes)
      .where(eq(votes.feedId, id));
    
    // Get categories and tags
    const [feedCats, feedTagsList, userVote, isFavorited] = await Promise.all([
      db.query.feedCategories.findMany({
        where: eq(feedCategories.feedId, id),
        with: { category: true },
      }),
      db.query.feedTags.findMany({
        where: eq(feedTags.feedId, id),
        with: { tag: true },
      }),
      userId
        ? db.query.votes.findFirst({
            where: and(eq(votes.feedId, id), eq(votes.userId, userId)),
          })
        : null,
      userId
        ? db.query.userFavorites.findFirst({
            where: and(eq(userFavorites.feedId, id), eq(userFavorites.userId, userId)),
          })
        : null,
    ]);
    
    const submitter = feed.submitter as { id: string; displayName: string; avatarUrl: string | null } | null;
    const approver = feed.approver as { id: string; displayName: string } | null;
    
    return {
      ...feed,
      submittedBy: submitter ? {
        id: submitter.id,
        displayName: submitter.displayName,
        avatarUrl: submitter.avatarUrl,
      } : null,
      approvedBy: approver ? {
        id: approver.id,
        displayName: approver.displayName,
      } : null,
      categories: feedCats.map(fc => fc.category),
      tags: feedTagsList.map(ft => ft.tag),
      ...voteStats,
      userVote: userVote?.value ?? null,
      isFavorited: !!isFavorited,
    };
  });
  
  // Submit new feed
  fastify.post('/', { preHandler: authenticate }, async (request) => {
    const body = submitFeedSchema.parse(request.body);
    const userId = request.user.userId;
    
    // Check if feed already exists
    const existing = await db.query.feeds.findFirst({
      where: eq(feeds.url, body.url),
    });
    
    if (existing) {
      return { error: 'Feed already exists', existingFeedId: existing.id };
    }
    
    // Fetch feed metadata from the URL
    let feedMetadata: {
      title?: string;
      description?: string;
      siteUrl?: string;
      imageUrl?: string;
      language?: string;
      postingFrequency?: string;
      postsPerWeek?: string;
      lastPostAt?: Date | null;
      items?: Array<{
        guid: string;
        title?: string;
        link?: string;
        content?: string;
        contentSnippet?: string;
        isoDate?: string;
      }>;
    } = {};
    
    try {
      const parsed = await parseFeed(body.url);
      const { frequency, postsPerWeek } = calculatePostingFrequency(parsed.items);
      const lastPostDate = parsed.items[0]?.isoDate 
        ? new Date(parsed.items[0].isoDate) 
        : null;
      
      feedMetadata = {
        title: parsed.title,
        description: parsed.description,
        siteUrl: parsed.link,
        imageUrl: parsed.imageUrl,
        language: parsed.language,
        postingFrequency: frequency,
        postsPerWeek: postsPerWeek.toString(),
        lastPostAt: lastPostDate,
        items: parsed.items,
      };
    } catch (error) {
      // Log but don't fail - feed will be created with minimal info
      console.error(`Failed to parse feed ${body.url}:`, error);
    }
    
    // Create feed - user-provided values take precedence over parsed values
    const [feed] = await db.insert(feeds).values({
      url: body.url,
      title: body.title || feedMetadata.title,
      titleSource: body.title ? 'user' : 'feed',
      description: body.description || feedMetadata.description,
      descriptionSource: body.description ? 'user' : 'feed',
      siteUrl: feedMetadata.siteUrl,
      imageUrl: feedMetadata.imageUrl,
      language: feedMetadata.language,
      postingFrequency: feedMetadata.postingFrequency,
      postsPerWeek: feedMetadata.postsPerWeek,
      lastPostAt: feedMetadata.lastPostAt,
      lastFetchedAt: new Date(),
      status: 'pending',
      submittedBy: userId,
    }).returning();
    
    // Add categories if provided
    if (body.categoryIds?.length) {
      await db.insert(feedCategories).values(
        body.categoryIds.map(categoryId => ({
          feedId: feed.id,
          categoryId,
          source: 'user' as const,
        }))
      );
    }
    
    // Add tags if provided
    if (body.tagIds?.length) {
      await db.insert(feedTags).values(
        body.tagIds.map(tagId => ({
          feedId: feed.id,
          tagId,
          source: 'user' as const,
          createdBy: userId,
        }))
      );
    }
    
    // Store feed posts if we have them
    if (feedMetadata.items?.length) {
      for (const item of feedMetadata.items) {
        try {
          await db.insert(feedPosts).values({
            feedId: feed.id,
            guid: item.guid,
            title: item.title,
            link: item.link,
            content: item.content || item.contentSnippet,
            publishedAt: item.isoDate ? new Date(item.isoDate) : null,
          });
        } catch (err) {
          // Ignore duplicate posts
          console.error(`Failed to insert post ${item.guid}:`, err);
        }
      }
      
      // Regenerate daily stats from actual post dates
      try {
        await regenerateDailyStats(feed.id);
      } catch (err) {
        console.error(`Failed to regenerate daily stats for feed ${feed.id}:`, err);
      }
    }
    
    // Run LLM analysis asynchronously (don't block the response)
    if (env.OPENAI_API_KEY && feedMetadata.items?.length) {
      // Fire and forget - don't await
      (async () => {
        try {
          console.log(`Starting LLM analysis for feed ${feed.id}...`);
          
          const samplePosts = feedMetadata.items!.slice(0, 5).map(item => ({
            title: item.title || '',
            content: item.content || item.contentSnippet || '',
          }));
          
          const analysis = await analyzeFeed(
            feed.url,
            feed.title,
            feed.description,
            samplePosts
          );
          
          console.log(`LLM analysis complete for feed ${feed.id}:`, analysis);
          
          // Update feed with LLM analysis
          await db.update(feeds)
            .set({
              title: feed.title || analysis.title,
              titleSource: feed.title ? 'user' : 'llm',
              description: feed.description || analysis.description,
              descriptionSource: feed.description ? 'user' : 'llm',
              contentType: analysis.contentType,
              language: analysis.language || feed.language,
              postingFrequency: analysis.postingFrequency || feed.postingFrequency,
              lastAnalyzedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(feeds.id, feed.id));
          
          // Add LLM-suggested categories
          for (const categoryName of analysis.categories) {
            const category = await db.query.categories.findFirst({
              where: eq(categories.name, categoryName),
            });
            
            if (category) {
              await db
                .insert(feedCategories)
                .values({
                  feedId: feed.id,
                  categoryId: category.id,
                  source: 'llm',
                })
                .onConflictDoNothing();
            }
          }
          
          // Add LLM-suggested tags
          for (const tagName of analysis.tags) {
            const slug = tagName.toLowerCase().replace(/\s+/g, '-');
            let tag = await db.query.tags.findFirst({
              where: eq(tags.slug, slug),
            });
            
            if (!tag) {
              const [newTag] = await db.insert(tags).values({
                name: tagName,
                slug,
              }).returning();
              tag = newTag;
            }
            
            await db
              .insert(feedTags)
              .values({
                feedId: feed.id,
                tagId: tag.id,
                source: 'llm',
                createdBy: userId,
              })
              .onConflictDoNothing();
            
            // Update tag usage count
            await db.update(tags)
              .set({ usageCount: sql`${tags.usageCount} + 1` })
              .where(eq(tags.id, tag.id));
          }
          
          console.log(`LLM categorization complete for feed ${feed.id}`);
        } catch (error) {
          console.error(`LLM analysis failed for feed ${feed.id}:`, error);
        }
      })();
    }
    
    return feed;
  });
  
  // Toggle favorite
  fastify.post('/:id/favorite', { preHandler: authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    const userId = request.user.userId;
    
    const existing = await db.query.userFavorites.findFirst({
      where: and(eq(userFavorites.feedId, id), eq(userFavorites.userId, userId)),
    });
    
    if (existing) {
      await db.delete(userFavorites)
        .where(and(eq(userFavorites.feedId, id), eq(userFavorites.userId, userId)));
      return { isFavorited: false };
    } else {
      await db.insert(userFavorites).values({ feedId: id, userId });
      return { isFavorited: true };
    }
  });
  
  // Get feed posts
  fastify.get('/:id/posts', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page, pageSize } = z.object({
      page: z.coerce.number().default(1),
      pageSize: z.coerce.number().default(20),
    }).parse(request.query);
    
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, id),
    });
    
    if (!feed) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    const offset = (page - 1) * pageSize;
    
    const posts = await db.query.feedPosts.findMany({
      where: eq(feedPosts.feedId, id),
      orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
      limit: pageSize,
      offset,
    });
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedPosts)
      .where(eq(feedPosts.feedId, id));
    
    return {
      data: posts,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  });
  
  // Get feed history/stats
  fastify.get('/:id/history', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, id),
    });
    
    if (!feed) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    // Get daily stats for the last 90 days
    const dailyStats = await db.query.feedDailyStats.findMany({
      where: eq(feedDailyStats.feedId, id),
      orderBy: (stats, { desc }) => [desc(stats.date)],
      limit: 90,
    });
    
    // Get post statistics from feedPosts table
    const [stats] = await db
      .select({
        totalPosts: sql<number>`count(*)::int`,
        firstPostAt: sql<string>`min(${feedPosts.publishedAt})`,
        lastPostAt: sql<string>`max(${feedPosts.publishedAt})`,
      })
      .from(feedPosts)
      .where(eq(feedPosts.feedId, id));
    
    // Calculate additional stats
    const activeDays = dailyStats.filter(s => s.postCount > 0).length;
    const totalPostsFromDaily = dailyStats.reduce((sum, s) => sum + s.postCount, 0);
    const avgPostsPerActiveDay = activeDays > 0 
      ? (totalPostsFromDaily / activeDays).toFixed(2) 
      : '0';
    
    // Recent activity
    const last7d = dailyStats.slice(0, 7).reduce((sum, s) => sum + s.postCount, 0);
    const last30d = dailyStats.slice(0, 30).reduce((sum, s) => sum + s.postCount, 0);
    const last90d = dailyStats.reduce((sum, s) => sum + s.postCount, 0);
    
    return {
      feedId: id,
      totalPosts: stats?.totalPosts || 0,
      firstPostAt: stats?.firstPostAt || null,
      lastPostAt: stats?.lastPostAt || null,
      activeDays,
      avgPostsPerActiveDay,
      postsLast7d: last7d,
      postsLast30d: last30d,
      postsLast90d: last90d,
      dailyStats: dailyStats.map(s => ({
        date: s.date,
        postCount: s.postCount,
      })),
    };
  });
  
  // Get feed analytics (feature usage, author stats, etc.)
  fastify.get('/:id/analytics', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { refresh } = z.object({
      refresh: z.coerce.boolean().default(false),
    }).parse(request.query);
    
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, id),
    });
    
    if (!feed) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    // Refresh analytics if requested
    if (refresh) {
      await updateFeedAnalytics(id);
    }
    
    // Get analytics
    let analytics = await getFeedAnalytics(id);
    
    // If no analytics exist, compute them
    if (!analytics) {
      await updateFeedAnalytics(id);
      analytics = await getFeedAnalytics(id);
    }
    
    if (!analytics) {
      return reply.status(404).send({ error: 'Analytics not available' });
    }
    
    // Calculate feature percentages
    const totalPosts = analytics.totalPosts || 1;
    
    return {
      feedId: id,
      feedTitle: feed.title,
      feedUrl: feed.url,
      
      // Summary stats
      summary: {
        totalPosts: analytics.totalPosts,
        uniqueAuthors: analytics.uniqueAuthors,
        uniqueCategories: analytics.uniqueCategories,
        dateRange: {
          oldest: analytics.oldestPostDate,
          newest: analytics.newestPostDate,
        },
      },
      
      // Feature flags with percentages
      features: {
        authors: {
          enabled: analytics.hasAuthors,
          count: analytics.uniqueAuthors,
          postsWithAuthor: analytics.postsWithAuthor,
          percentage: Math.round((analytics.postsWithAuthor / totalPosts) * 100),
        },
        categories: {
          enabled: analytics.hasCategories,
          count: analytics.uniqueCategories,
          postsWithCategories: analytics.postsWithCategories,
          percentage: Math.round((analytics.postsWithCategories / totalPosts) * 100),
        },
        media: {
          enabled: analytics.hasMedia,
          postsWithMedia: analytics.postsWithMedia,
          percentage: Math.round((analytics.postsWithMedia / totalPosts) * 100),
        },
        thumbnails: {
          enabled: analytics.hasThumbnails,
          postsWithThumbnail: analytics.postsWithThumbnail,
          percentage: Math.round((analytics.postsWithThumbnail / totalPosts) * 100),
        },
        enclosures: {
          enabled: analytics.hasEnclosures,
          postsWithEnclosure: analytics.postsWithEnclosure,
          percentage: Math.round((analytics.postsWithEnclosure / totalPosts) * 100),
        },
        durations: {
          enabled: analytics.hasDurations,
          postsWithDuration: analytics.postsWithDuration,
          percentage: Math.round((analytics.postsWithDuration / totalPosts) * 100),
          avgDurationSeconds: analytics.avgDurationSeconds,
          totalDurationSeconds: analytics.totalDurationSeconds,
        },
        fullContent: {
          enabled: analytics.hasFullContent,
          postsWithFullContent: analytics.postsWithFullContent,
          percentage: Math.round((analytics.postsWithFullContent / totalPosts) * 100),
        },
        comments: {
          postsWithComments: analytics.postsWithComments,
          percentage: Math.round((analytics.postsWithComments / totalPosts) * 100),
        },
      },
      
      // Content stats
      content: {
        postsWithContent: analytics.postsWithContent,
        avgContentLength: analytics.avgContentLength,
        avgTitleLength: analytics.avgTitleLength,
      },
      
      // Top items
      topAuthors: analytics.topAuthors || [],
      topCategories: analytics.topCategories || [],
      mediaTypes: analytics.mediaTypes || [],
      
      // Feed type detection
      isPodcast: analytics.isPodcast,
      
      // Metadata
      analyzedAt: analytics.analyzedAt,
    };
  });
}
