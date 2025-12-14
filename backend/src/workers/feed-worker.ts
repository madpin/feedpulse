import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { db } from '../db/index.js';
import { updateQueue, feeds } from '../db/schema/index.js';
import { eq, and, lte } from 'drizzle-orm';
import { processFeed, analyzeFeedWithLLM } from '../services/feed-processor.js';

// Redis connection (lazy initialization)
let connection: IORedis | null = null;
let feedUpdateQueue: Queue | null = null;
let worker: Worker | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

function getQueue(): Queue {
  if (!feedUpdateQueue) {
    feedUpdateQueue = new Queue('feed-updates', { connection: getConnection() });
  }
  return feedUpdateQueue;
}

// Start the worker (call this from main process)
export function startWorker(): Worker {
  if (worker) {
    return worker;
  }
  
  const conn = getConnection();
  
  worker = new Worker(
    'feed-updates',
    async (job: Job) => {
      const { feedId, analyze } = job.data;
      
      console.log(`[Worker] Processing feed ${feedId}...`);
      
      // Update queue status
      await db.update(updateQueue)
        .set({ status: 'processing', startedAt: new Date() })
        .where(and(
          eq(updateQueue.feedId, feedId),
          eq(updateQueue.status, 'pending')
        ));
      
      try {
        // Process feed
        const result = await processFeed(feedId);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        // Analyze with LLM if requested or if it's a new feed
        if (analyze) {
          console.log(`[Worker] Analyzing feed ${feedId} with LLM...`);
          await analyzeFeedWithLLM(feedId);
        }
        
        // Update queue status
        await db.update(updateQueue)
          .set({ status: 'completed', completedAt: new Date() })
          .where(and(
            eq(updateQueue.feedId, feedId),
            eq(updateQueue.status, 'processing')
          ));
        
        console.log(`[Worker] Feed ${feedId} processed successfully. New posts: ${result.newPosts}`);
        
        return result;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Update queue status
        await db.update(updateQueue)
          .set({ 
            status: 'failed', 
            completedAt: new Date(),
            errorMessage,
          })
          .where(and(
            eq(updateQueue.feedId, feedId),
            eq(updateQueue.status, 'processing')
          ));
        
        console.error(`[Worker] Feed ${feedId} processing failed:`, errorMessage);
        throw error;
      }
    },
    {
      connection: conn,
      concurrency: env.MAX_CONCURRENT_FEED_UPDATES,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });
  
  console.log('[Worker] Feed worker started');
  
  return worker;
}

// Stop the worker gracefully
export async function stopWorker(): Promise<void> {
  if (worker) {
    console.log('[Worker] Shutting down feed worker...');
    await worker.close();
    worker = null;
  }
  if (connection) {
    await connection.quit();
    connection = null;
  }
  feedUpdateQueue = null;
}

// Schedule daily updates
export async function scheduleAllFeedUpdates(): Promise<void> {
  console.log('Scheduling daily feed updates...');
  
  const queue = getQueue();
  
  // Get all active feeds
  const activeFeeds = await db.query.feeds.findMany({
    where: eq(feeds.status, 'active'),
    columns: { id: true },
  });
  
  // Add to queue
  for (const feed of activeFeeds) {
    await queue.add(
      'update-feed',
      { feedId: feed.id, analyze: false },
      {
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000,
        },
      }
    );
    
    // Also add to database queue
    await db.insert(updateQueue).values({
      feedId: feed.id,
      priority: 0,
    });
  }
  
  console.log(`Scheduled ${activeFeeds.length} feeds for update`);
}

// Process pending queue items
export async function processPendingQueue(): Promise<void> {
  const queue = getQueue();
  
  const pendingItems = await db.query.updateQueue.findMany({
    where: and(
      eq(updateQueue.status, 'pending'),
      lte(updateQueue.scheduledAt, new Date())
    ),
    orderBy: (q, { desc }) => [desc(q.priority), q.scheduledAt],
    limit: 100,
  });
  
  for (const item of pendingItems) {
    await queue.add(
      'update-feed',
      { feedId: item.feedId, analyze: false },
      {
        removeOnComplete: 100,
        removeOnFail: 100,
      }
    );
  }
}

// Queue a single feed for update
export async function queueFeedUpdate(
  feedId: string, 
  options: { analyze?: boolean; priority?: number } = {}
): Promise<void> {
  const queue = getQueue();
  
  await queue.add(
    'update-feed',
    { feedId, analyze: options.analyze ?? false },
    {
      priority: options.priority ?? 0,
      removeOnComplete: 100,
      removeOnFail: 100,
    }
  );
  
  console.log(`[Queue] Feed ${feedId} queued for update (analyze: ${options.analyze ?? false})`);
}
