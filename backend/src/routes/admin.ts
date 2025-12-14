import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { feeds, users, updateQueue, settings, pointTransactions, notifications, feedFetchLogs, feedPosts, feedDailyStats } from '../db/schema/index.js';
import { eq, desc, sql, and } from 'drizzle-orm';
import { requireAdmin } from '../middleware/auth.js';
import { queueFeedUpdate } from '../workers/feed-worker.js';
import { parseFeed, calculatePostingFrequency } from '../lib/feed-parser.js';
import { regenerateDailyStats, regenerateAllDailyStats, cleanupOldPosts, cleanupOldPostsForFeed } from '../services/feed-analytics.js';

const approveFeedSchema = z.object({
  status: z.enum(['active', 'rejected']),
  rejectionReason: z.string().optional(),
});

const updateFeedSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'active', 'inactive', 'rejected']).optional(),
  useReadability: z.boolean().optional(),
});

const updateUserSchema = z.object({
  role: z.enum(['user', 'contributor', 'admin']).optional(),
  points: z.number().optional(),
});

export async function adminRoutes(fastify: FastifyInstance) {
  // All routes require admin
  fastify.addHook('preHandler', requireAdmin);
  
  // Dashboard stats
  fastify.get('/stats', async () => {
    const [feedStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where status = 'active')::int`,
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        inactive: sql<number>`count(*) filter (where status = 'inactive')::int`,
      })
      .from(feeds);
    
    const [userStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        admins: sql<number>`count(*) filter (where role = 'admin')::int`,
        contributors: sql<number>`count(*) filter (where role = 'contributor')::int`,
        users: sql<number>`count(*) filter (where role = 'user')::int`,
      })
      .from(users);
    
    const [queueStats] = await db
      .select({
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        processing: sql<number>`count(*) filter (where status = 'processing')::int`,
        failed: sql<number>`count(*) filter (where status = 'failed')::int`,
      })
      .from(updateQueue);
    
    return {
      feeds: feedStats,
      users: userStats,
      queue: queueStats,
    };
  });
  
  // Get pending feeds
  fastify.get('/feeds/pending', async (request) => {
    const { page, pageSize } = z.object({
      page: z.coerce.number().default(1),
      pageSize: z.coerce.number().default(20),
    }).parse(request.query);
    
    const offset = (page - 1) * pageSize;
    
    const pendingFeeds = await db.query.feeds.findMany({
      where: eq(feeds.status, 'pending'),
      with: {
        submitter: {
          columns: { id: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: [desc(feeds.createdAt)],
      limit: pageSize,
      offset,
    });
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(feeds)
      .where(eq(feeds.status, 'pending'));
    
    return {
      data: pendingFeeds,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  });
  
  // Approve/reject feed
  fastify.post('/feeds/:id/review', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = approveFeedSchema.parse(request.body);
    const userId = request.user.userId;
    
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, id),
    });
    
    if (!feed) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    const [updated] = await db.update(feeds)
      .set({
        status: body.status,
        rejectionReason: body.rejectionReason,
        approvedBy: body.status === 'active' ? userId : null,
        approvedAt: body.status === 'active' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(feeds.id, id))
      .returning();
    
    // Award points if approved
    if (body.status === 'active' && feed.submittedBy) {
      const points = 10; // Base points for approved feed
      
      await db.insert(pointTransactions).values({
        userId: feed.submittedBy,
        amount: points,
        reason: 'feed_approved',
        referenceType: 'feed',
        referenceId: id,
      });
      
      await db.update(users)
        .set({ points: sql`${users.points} + ${points}` })
        .where(eq(users.id, feed.submittedBy));
      
      // Create notification
      await db.insert(notifications).values({
        userId: feed.submittedBy,
        type: 'feed_approved',
        title: 'Your feed was approved!',
        message: `${feed.title || feed.url} is now live on FeedPulse.`,
        referenceType: 'feed',
        referenceId: id,
      });
    }
    
    return updated;
  });
  
  // Update feed
  fastify.patch('/feeds/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateFeedSchema.parse(request.body);
    
    const [updated] = await db.update(feeds)
      .set({
        ...body,
        titleSource: body.title ? 'admin' : undefined,
        descriptionSource: body.description ? 'admin' : undefined,
        updatedAt: new Date(),
      })
      .where(eq(feeds.id, id))
      .returning();
    
    if (!updated) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    return updated;
  });
  
  // Trigger feed update
  fastify.post('/feeds/:id/update', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { analyze } = z.object({
      analyze: z.boolean().default(true),
    }).parse(request.body || {});
    const userId = request.user.userId;
    
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, id),
    });
    
    if (!feed) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    // Add to database queue
    const [queueItem] = await db.insert(updateQueue).values({
      feedId: id,
      priority: 10, // High priority for manual triggers
      triggeredBy: userId,
    }).returning();
    
    // Queue to BullMQ for actual processing
    await queueFeedUpdate(id, { analyze, priority: 10 });
    fastify.log.info(`Queued feed ${id} for update (manual trigger, analyze: ${analyze})`);
    
    return { queued: true, queueId: queueItem.id, analyze };
  });
  
  // Get all users
  fastify.get('/users', async (request) => {
    const { page, pageSize, role } = z.object({
      page: z.coerce.number().default(1),
      pageSize: z.coerce.number().default(20),
      role: z.enum(['user', 'contributor', 'admin']).optional(),
    }).parse(request.query);
    
    const offset = (page - 1) * pageSize;
    
    const userList = await db.query.users.findMany({
      where: role ? eq(users.role, role) : undefined,
      columns: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        points: true,
        createdAt: true,
      },
      orderBy: [desc(users.createdAt)],
      limit: pageSize,
      offset,
    });
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(role ? eq(users.role, role) : undefined);
    
    return {
      data: userList,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  });
  
  // Update user
  fastify.patch('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateUserSchema.parse(request.body);
    
    const [updated] = await db.update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        points: users.points,
      });
    
    if (!updated) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return updated;
  });
  
  // Get/update settings
  fastify.get('/settings', async () => {
    const allSettings = await db.query.settings.findMany();
    return allSettings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, unknown>);
  });
  
  fastify.patch('/settings', async (request) => {
    const body = request.body as Record<string, unknown>;
    const userId = request.user.userId;
    
    for (const [key, value] of Object.entries(body)) {
      await db
        .insert(settings)
        .values({
          key,
          value: value as object,
          updatedBy: userId,
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            value: value as object,
            updatedAt: new Date(),
            updatedBy: userId,
          },
        });
    }
    
    return { success: true };
  });
  
  // Trigger bulk update
  fastify.post('/feeds/update-all', async (request) => {
    const { analyze } = z.object({
      analyze: z.boolean().default(false),
    }).parse(request.body || {});
    const userId = request.user.userId;
    
    // Get all active feeds
    const activeFeeds = await db.query.feeds.findMany({
      where: eq(feeds.status, 'active'),
      columns: { id: true },
    });
    
    // Queue all feeds to database
    if (activeFeeds.length > 0) {
      await db.insert(updateQueue).values(
        activeFeeds.map(f => ({
          feedId: f.id,
          priority: analyze ? 5 : 0, // Higher priority if analyzing
          triggeredBy: userId,
        }))
      );
    }
    
    // Queue all feeds to BullMQ for actual processing
    for (const feed of activeFeeds) {
      await queueFeedUpdate(feed.id, { analyze, priority: analyze ? 5 : 0 });
    }
    
    fastify.log.info(`Bulk update: queued ${activeFeeds.length} feeds for update (analyze: ${analyze})`);
    
    return { queued: activeFeeds.length, analyze };
  });
  
  // Get queue items with details
  fastify.get('/queue', async (request) => {
    const { page, pageSize, status } = z.object({
      page: z.coerce.number().default(1),
      pageSize: z.coerce.number().default(50),
      status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    }).parse(request.query);
    
    const offset = (page - 1) * pageSize;
    
    // Build where conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(updateQueue.status, status));
    }
    
    const queueItems = await db.query.updateQueue.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        feed: {
          columns: { id: true, title: true, url: true },
        },
        triggerer: {
          columns: { id: true, displayName: true },
        },
      },
      orderBy: [desc(updateQueue.priority), desc(updateQueue.createdAt)],
      limit: pageSize,
      offset,
    });
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(updateQueue)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    // Get stats by status
    const [queueStats] = await db
      .select({
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        processing: sql<number>`count(*) filter (where status = 'processing')::int`,
        completed: sql<number>`count(*) filter (where status = 'completed')::int`,
        failed: sql<number>`count(*) filter (where status = 'failed')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(updateQueue);
    
    // Get recent activity stats (last 24 hours)
    const [recentStats] = await db
      .select({
        completedLast24h: sql<number>`count(*) filter (where status = 'completed' and completed_at > now() - interval '24 hours')::int`,
        failedLast24h: sql<number>`count(*) filter (where status = 'failed' and completed_at > now() - interval '24 hours')::int`,
        avgProcessingTimeMs: sql<number>`avg(extract(epoch from (completed_at - started_at)) * 1000) filter (where status = 'completed' and started_at is not null and completed_at is not null)::int`,
      })
      .from(updateQueue);
    
    return {
      data: queueItems,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
      stats: {
        ...queueStats,
        completedLast24h: recentStats.completedLast24h || 0,
        failedLast24h: recentStats.failedLast24h || 0,
        avgProcessingTimeMs: recentStats.avgProcessingTimeMs || 0,
      },
    };
  });
  
  // Clear completed/failed queue items
  fastify.delete('/queue/clear', async (request) => {
    const { status } = z.object({
      status: z.enum(['completed', 'failed', 'all']).default('completed'),
    }).parse(request.query);
    
    let deleted = 0;
    
    if (status === 'all') {
      const result = await db.delete(updateQueue)
        .where(sql`status IN ('completed', 'failed')`)
        .returning();
      deleted = result.length;
    } else {
      const result = await db.delete(updateQueue)
        .where(eq(updateQueue.status, status))
        .returning();
      deleted = result.length;
    }
    
    fastify.log.info(`Cleared ${deleted} ${status} queue items`);
    
    return { deleted, status };
  });
  
  // Retry failed queue items
  fastify.post('/queue/retry-failed', async () => {
    // Get all failed items
    const failedItems = await db.query.updateQueue.findMany({
      where: eq(updateQueue.status, 'failed'),
      columns: { id: true, feedId: true },
    });
    
    // Reset status to pending and re-queue
    for (const item of failedItems) {
      await db.update(updateQueue)
        .set({ 
          status: 'pending', 
          errorMessage: null,
          startedAt: null,
          completedAt: null,
        })
        .where(eq(updateQueue.id, item.id));
      
      await queueFeedUpdate(item.feedId, { analyze: true, priority: 5 });
    }
    
    fastify.log.info(`Retried ${failedItems.length} failed queue items`);
    
    return { retried: failedItems.length };
  });
  
  // Get feed fetch logs
  fastify.get('/logs', async (request) => {
    const { page, pageSize, feedId, success } = z.object({
      page: z.coerce.number().default(1),
      pageSize: z.coerce.number().default(50),
      feedId: z.string().uuid().optional(),
      success: z.enum(['true', 'false']).optional(),
    }).parse(request.query);
    
    const offset = (page - 1) * pageSize;
    
    // Build where conditions
    const conditions = [];
    if (feedId) {
      conditions.push(eq(feedFetchLogs.feedId, feedId));
    }
    if (success !== undefined) {
      conditions.push(eq(feedFetchLogs.success, success === 'true'));
    }
    
    const logs = await db.query.feedFetchLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        feed: {
          columns: { id: true, title: true, url: true },
        },
      },
      orderBy: [desc(feedFetchLogs.fetchedAt)],
      limit: pageSize,
      offset,
    });
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedFetchLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    return {
      data: logs,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  });
  
  // Bulk import feeds from a list of URLs
  fastify.post('/feeds/bulk-import', async (request) => {
    const body = z.object({
      urls: z.string().describe('URLs separated by commas, spaces, newlines, or semicolons'),
      autoApprove: z.boolean().default(false),
    }).parse(request.body);
    
    const userId = request.user.userId;
    
    // Parse URLs from the input string - support comma, space, newline, semicolon separators
    const urlList = body.urls
      .split(/[\s,;\n]+/)
      .map(url => url.trim())
      .filter(url => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
    
    if (urlList.length === 0) {
      return { error: 'No valid URLs found', imported: 0, failed: 0, results: [] };
    }
    
    const results: Array<{
      url: string;
      success: boolean;
      feedId?: string;
      error?: string;
    }> = [];
    
    for (const url of urlList) {
      try {
        // Check if feed already exists
        const existing = await db.query.feeds.findFirst({
          where: eq(feeds.url, url),
        });
        
        if (existing) {
          results.push({ url, success: false, error: 'Feed already exists', feedId: existing.id });
          continue;
        }
        
        // Parse the feed
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
          const parsed = await parseFeed(url);
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
        } catch (parseError) {
          results.push({ url, success: false, error: `Failed to parse feed: ${parseError}` });
          continue;
        }
        
        // Create the feed
        const [feed] = await db.insert(feeds).values({
          url,
          title: feedMetadata.title,
          titleSource: 'feed',
          description: feedMetadata.description,
          descriptionSource: 'feed',
          siteUrl: feedMetadata.siteUrl,
          imageUrl: feedMetadata.imageUrl,
          language: feedMetadata.language,
          postingFrequency: feedMetadata.postingFrequency,
          postsPerWeek: feedMetadata.postsPerWeek,
          lastPostAt: feedMetadata.lastPostAt,
          lastFetchedAt: new Date(),
          status: body.autoApprove ? 'active' : 'pending',
          submittedBy: userId,
          approvedBy: body.autoApprove ? userId : null,
          approvedAt: body.autoApprove ? new Date() : null,
        }).returning();
        
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
              
              // Update daily stats
              if (item.isoDate) {
                const postDate = new Date(item.isoDate).toISOString().split('T')[0];
                await db
                  .insert(feedDailyStats)
                  .values({
                    feedId: feed.id,
                    date: postDate,
                    postCount: 1,
                  })
                  .onConflictDoUpdate({
                    target: [feedDailyStats.feedId, feedDailyStats.date],
                    set: {
                      postCount: sql`${feedDailyStats.postCount} + 1`,
                      updatedAt: new Date(),
                    },
                  });
              }
            } catch {
              // Ignore duplicate posts
            }
          }
        }
        
        // Queue feed for LLM analysis to assign categories and tags
        await queueFeedUpdate(feed.id, { analyze: true, priority: 5 });
        
        results.push({ url, success: true, feedId: feed.id });
        
      } catch (err) {
        results.push({ url, success: false, error: `${err}` });
      }
    }
    
    const imported = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    fastify.log.info(`Bulk import: ${imported} imported, ${failed} failed out of ${urlList.length} URLs`);
    
    return {
      imported,
      failed,
      total: urlList.length,
      results,
    };
  });

  // Regenerate daily stats for a single feed
  fastify.post('/feeds/:id/regenerate-stats', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, id),
    });
    
    if (!feed) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    const result = await regenerateDailyStats(id);
    
    return {
      feedId: id,
      feedTitle: feed.title,
      ...result,
    };
  });

  // Regenerate daily stats for all feeds
  fastify.post('/regenerate-all-stats', async () => {
    const result = await regenerateAllDailyStats();
    
    return result;
  });

  // Cleanup old posts (365 day retention by default)
  fastify.post('/cleanup-old-posts', async (request) => {
    const { retentionDays } = z.object({
      retentionDays: z.coerce.number().min(30).max(3650).default(365),
    }).parse(request.query);
    
    const result = await cleanupOldPosts(retentionDays);
    
    return {
      retentionDays,
      ...result,
    };
  });

  // Text ingestor - extract URLs from text and validate as feeds
  fastify.post('/ingestor/extract', async (request) => {
    const body = z.object({
      text: z.string().min(1).describe('Long text that may contain URLs'),
    }).parse(request.body);
    
    // Regex to extract URLs from text - stop at whitespace, quotes, angle brackets, or markdown reference markers
    const urlRegex = /https?:\/\/[^\s<>"'\[\]]+/gi;
    const matches = body.text.match(urlRegex) || [];
    
    // Deduplicate and clean URLs
    const uniqueUrls = [...new Set(matches.map(url => {
      // Remove trailing punctuation that might have been captured
      return url.replace(/[.,;:!?)]+$/, '');
    }))];
    
    if (uniqueUrls.length === 0) {
      return { 
        extracted: 0, 
        urls: [],
        message: 'No URLs found in the provided text' 
      };
    }
    
    return {
      extracted: uniqueUrls.length,
      urls: uniqueUrls,
    };
  });

  // Text ingestor - validate URLs as RSS/Atom feeds (with SSE streaming and parallel processing)
  fastify.post('/ingestor/validate', async (request, reply) => {
    const body = z.object({
      urls: z.array(z.string().url()),
      stream: z.boolean().default(false),
      timeoutMs: z.number().min(1000).max(60000).default(15000), // Configurable timeout (default 15s)
      concurrency: z.number().min(1).max(20).default(5), // Parallel processing (default 5 concurrent)
    }).parse(request.body);
    
    type ValidationResult = {
      url: string;
      isValid: boolean;
      exists: boolean;
      existingFeedId?: string;
      feedInfo?: {
        title?: string;
        description?: string;
        siteUrl?: string;
        imageUrl?: string;
        language?: string;
        postingFrequency?: string;
        postsPerWeek?: number;
        itemCount?: number;
      };
      error?: string;
    };
    
    const results: ValidationResult[] = [];
    
    // Helper function to validate a single URL
    const validateUrl = async (url: string): Promise<ValidationResult> => {
      try {
        // Check if feed already exists
        const existing = await db.query.feeds.findFirst({
          where: eq(feeds.url, url),
        });
        
        if (existing) {
          return {
            url,
            isValid: true,
            exists: true,
            existingFeedId: existing.id,
            feedInfo: {
              title: existing.title ?? undefined,
              description: existing.description ?? undefined,
            },
          };
        }
        
        // Try to parse as RSS/Atom feed with configurable timeout
        const parsed = await parseFeed(url, body.timeoutMs);
        const { frequency, postsPerWeek } = calculatePostingFrequency(parsed.items);
        
        return {
          url,
          isValid: true,
          exists: false,
          feedInfo: {
            title: parsed.title,
            description: parsed.description,
            siteUrl: parsed.link,
            imageUrl: parsed.imageUrl,
            language: parsed.language,
            postingFrequency: frequency,
            postsPerWeek,
            itemCount: parsed.items.length,
          },
        };
      } catch (err) {
        return {
          url,
          isValid: false,
          exists: false,
          error: `Not a valid RSS/Atom feed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    };
    
    // If streaming is requested, use SSE with parallel processing
    if (body.stream) {
      // Get origin from request for CORS
      const origin = request.headers.origin || '*';
      
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
      });
      
      const sendEvent = (event: string, data: unknown) => {
        reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };
      
      // Send initial progress
      sendEvent('progress', { current: 0, total: body.urls.length });
      
      let completed = 0;
      const urls = body.urls;
      
      // Process URLs in parallel batches
      const processInBatches = async () => {
        const pending: Promise<void>[] = [];
        let index = 0;
        
        const processNext = async (): Promise<void> => {
          if (index >= urls.length) return;
          
          const currentIndex = index++;
          const url = urls[currentIndex];
          
          const result = await validateUrl(url);
          results.push(result);
          completed++;
          
          // Send progress and result
          sendEvent('progress', { current: completed, total: urls.length });
          sendEvent('result', result);
          
          // Process next URL
          await processNext();
        };
        
        // Start initial batch of concurrent workers
        for (let i = 0; i < Math.min(body.concurrency, urls.length); i++) {
          pending.push(processNext());
        }
        
        await Promise.all(pending);
      };
      
      await processInBatches();
      
      // Send final summary
      const validCount = results.filter(r => r.isValid && !r.exists).length;
      const existingCount = results.filter(r => r.exists).length;
      const invalidCount = results.filter(r => !r.isValid).length;
      
      sendEvent('complete', {
        total: body.urls.length,
        valid: validCount,
        existing: existingCount,
        invalid: invalidCount,
        results,
      });
      
      reply.raw.end();
      return;
    }
    
    // Non-streaming mode - use parallel processing with configurable concurrency
    const processInParallel = async () => {
      const pending: Promise<void>[] = [];
      let index = 0;
      
      const processNext = async (): Promise<void> => {
        if (index >= body.urls.length) return;
        
        const url = body.urls[index++];
        const result = await validateUrl(url);
        results.push(result);
        
        await processNext();
      };
      
      for (let i = 0; i < Math.min(body.concurrency, body.urls.length); i++) {
        pending.push(processNext());
      }
      
      await Promise.all(pending);
    };
    
    await processInParallel();
    
    const validCount = results.filter(r => r.isValid && !r.exists).length;
    const existingCount = results.filter(r => r.exists).length;
    const invalidCount = results.filter(r => !r.isValid).length;
    
    return {
      total: body.urls.length,
      valid: validCount,
      existing: existingCount,
      invalid: invalidCount,
      results,
    };
  });

  // Text ingestor - import validated feeds (with SSE streaming)
  fastify.post('/ingestor/import', async (request, reply) => {
    const body = z.object({
      urls: z.array(z.string().url()),
      autoApprove: z.boolean().default(false),
      stream: z.boolean().default(false),
    }).parse(request.body);
    
    const userId = request.user.userId;
    
    type ImportResult = {
      url: string;
      success: boolean;
      feedId?: string;
      error?: string;
    };
    
    const results: ImportResult[] = [];
    
    // Helper function to import a single feed
    const importFeed = async (url: string): Promise<ImportResult> => {
      try {
        // Check if feed already exists
        const existing = await db.query.feeds.findFirst({
          where: eq(feeds.url, url),
        });
        
        if (existing) {
          return { url, success: false, error: 'Feed already exists', feedId: existing.id };
        }
        
        // Parse the feed
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
          const parsed = await parseFeed(url);
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
        } catch (parseError) {
          return { url, success: false, error: `Failed to parse feed: ${parseError}` };
        }
        
        // Create the feed
        const [feed] = await db.insert(feeds).values({
          url,
          title: feedMetadata.title,
          titleSource: 'feed',
          description: feedMetadata.description,
          descriptionSource: 'feed',
          siteUrl: feedMetadata.siteUrl,
          imageUrl: feedMetadata.imageUrl,
          language: feedMetadata.language,
          postingFrequency: feedMetadata.postingFrequency,
          postsPerWeek: feedMetadata.postsPerWeek,
          lastPostAt: feedMetadata.lastPostAt,
          lastFetchedAt: new Date(),
          status: body.autoApprove ? 'active' : 'pending',
          submittedBy: userId,
          approvedBy: body.autoApprove ? userId : null,
          approvedAt: body.autoApprove ? new Date() : null,
        }).returning();
        
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
              
              // Update daily stats
              if (item.isoDate) {
                const postDate = new Date(item.isoDate).toISOString().split('T')[0];
                await db
                  .insert(feedDailyStats)
                  .values({
                    feedId: feed.id,
                    date: postDate,
                    postCount: 1,
                  })
                  .onConflictDoUpdate({
                    target: [feedDailyStats.feedId, feedDailyStats.date],
                    set: {
                      postCount: sql`${feedDailyStats.postCount} + 1`,
                      updatedAt: new Date(),
                    },
                  });
              }
            } catch {
              // Ignore duplicate posts
            }
          }
        }
        
        // Queue feed for LLM analysis
        await queueFeedUpdate(feed.id, { analyze: true, priority: 5 });
        
        return { url, success: true, feedId: feed.id };
        
      } catch (err) {
        return { url, success: false, error: `${err}` };
      }
    };
    
    // If streaming is requested, use SSE
    if (body.stream) {
      // Get origin from request for CORS
      const origin = request.headers.origin || '*';
      
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
      });
      
      const sendEvent = (event: string, data: unknown) => {
        reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };
      
      // Send initial progress
      sendEvent('progress', { current: 0, total: body.urls.length });
      
      for (let i = 0; i < body.urls.length; i++) {
        const url = body.urls[i];
        const result = await importFeed(url);
        results.push(result);
        
        // Send progress and result for this URL
        sendEvent('progress', { current: i + 1, total: body.urls.length });
        sendEvent('result', result);
      }
      
      // Send final summary
      const imported = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      fastify.log.info(`Ingestor import (streaming): ${imported} imported, ${failed} failed out of ${body.urls.length} URLs`);
      
      sendEvent('complete', {
        imported,
        failed,
        total: body.urls.length,
        results,
      });
      
      reply.raw.end();
      return;
    }
    
    // Non-streaming mode (original behavior)
    for (const url of body.urls) {
      const result = await importFeed(url);
      results.push(result);
    }
    
    const imported = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    fastify.log.info(`Ingestor import: ${imported} imported, ${failed} failed out of ${body.urls.length} URLs`);
    
    return {
      imported,
      failed,
      total: body.urls.length,
      results,
    };
  });

  // Cleanup old posts for a single feed
  fastify.post('/feeds/:id/cleanup-old-posts', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { retentionDays } = z.object({
      retentionDays: z.coerce.number().min(30).max(3650).default(365),
    }).parse(request.query);
    
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, id),
    });
    
    if (!feed) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    const result = await cleanupOldPostsForFeed(id, retentionDays);
    
    return {
      feedId: id,
      feedTitle: feed.title,
      retentionDays,
      ...result,
    };
  });
}
