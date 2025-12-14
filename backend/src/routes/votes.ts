import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { votes, feeds } from '../db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';

const voteSchema = z.object({
  feedId: z.string().uuid(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export async function voteRoutes(fastify: FastifyInstance) {
  // Vote on a feed
  fastify.post('/', { preHandler: authenticate }, async (request) => {
    const body = voteSchema.parse(request.body);
    const userId = request.user.userId;
    
    // Check if feed exists
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, body.feedId),
    });
    
    if (!feed) {
      return { error: 'Feed not found' };
    }
    
    // Check for existing vote
    const existingVote = await db.query.votes.findFirst({
      where: and(eq(votes.feedId, body.feedId), eq(votes.userId, userId)),
    });
    
    if (existingVote) {
      if (existingVote.value === body.value) {
        // Same vote - remove it (toggle off)
        await db.delete(votes)
          .where(and(eq(votes.feedId, body.feedId), eq(votes.userId, userId)));
        return { userVote: null };
      } else {
        // Different vote - update it
        await db.update(votes)
          .set({ value: body.value, updatedAt: new Date() })
          .where(and(eq(votes.feedId, body.feedId), eq(votes.userId, userId)));
        return { userVote: body.value };
      }
    } else {
      // New vote
      await db.insert(votes).values({
        feedId: body.feedId,
        userId,
        value: body.value,
      });
      return { userVote: body.value };
    }
  });
  
  // Get vote counts for a feed
  fastify.get('/feed/:feedId', async (request) => {
    const { feedId } = request.params as { feedId: string };
    
    const [result] = await db
      .select({
        upvotes: sql<number>`COALESCE(COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END), 0)::int`,
        downvotes: sql<number>`COALESCE(COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END), 0)::int`,
        score: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
      })
      .from(votes)
      .where(eq(votes.feedId, feedId));
    
    return result;
  });
  
  // Get user's vote on a feed
  fastify.get('/feed/:feedId/me', { preHandler: authenticate }, async (request) => {
    const { feedId } = request.params as { feedId: string };
    const userId = request.user.userId;
    
    const vote = await db.query.votes.findFirst({
      where: and(eq(votes.feedId, feedId), eq(votes.userId, userId)),
    });
    
    return { userVote: vote?.value ?? null };
  });
}
