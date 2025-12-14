import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { feeds, votes } from '../db/schema/index.js';
import { eq, sql, ilike, or, and, desc } from 'drizzle-orm';
import { optionalAuth } from '../middleware/auth.js';
import { getEmbedding } from '../lib/llm.js';

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  semantic: z.coerce.boolean().default(false),
});

export async function searchRoutes(fastify: FastifyInstance) {
  // Text search
  fastify.get('/', { preHandler: optionalAuth }, async (request) => {
    const { query, limit, semantic } = searchSchema.parse(request.query);
    
    if (semantic) {
      // Semantic search using embeddings
      try {
        const embedding = await getEmbedding(query);
        
        const results = await db
          .select({
            feed: feeds,
            similarity: sql<number>`1 - (${feeds.embedding} <=> ${JSON.stringify(embedding)}::vector)`,
            upvotes: sql<number>`COALESCE(COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END), 0)::int`,
            downvotes: sql<number>`COALESCE(COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END), 0)::int`,
            score: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
          })
          .from(feeds)
          .leftJoin(votes, eq(feeds.id, votes.feedId))
          .where(and(
            eq(feeds.status, 'active'),
            sql`${feeds.embedding} IS NOT NULL`
          ))
          .groupBy(feeds.id)
          .orderBy(sql`${feeds.embedding} <=> ${JSON.stringify(embedding)}::vector`)
          .limit(limit);
        
        return results.map(r => ({
          ...r.feed,
          similarity: r.similarity,
          upvotes: r.upvotes,
          downvotes: r.downvotes,
          score: r.score,
        }));
      } catch (error) {
        // Fall back to text search if embedding fails
        fastify.log.error(error, 'Embedding search failed, falling back to text search');
      }
    }
    
    // Text search (fallback or default)
    const results = await db
      .select({
        feed: feeds,
        upvotes: sql<number>`COALESCE(COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END), 0)::int`,
        downvotes: sql<number>`COALESCE(COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END), 0)::int`,
        score: sql<number>`COALESCE(SUM(${votes.value}), 0)::int`,
      })
      .from(feeds)
      .leftJoin(votes, eq(feeds.id, votes.feedId))
      .where(and(
        eq(feeds.status, 'active'),
        or(
          ilike(feeds.title, `%${query}%`),
          ilike(feeds.description, `%${query}%`),
          ilike(feeds.url, `%${query}%`)
        )
      ))
      .groupBy(feeds.id)
      .orderBy(desc(sql`COALESCE(SUM(${votes.value}), 0)`))
      .limit(limit);
    
    return results.map(r => ({
      ...r.feed,
      upvotes: r.upvotes,
      downvotes: r.downvotes,
      score: r.score,
    }));
  });
  
  // Similar feeds
  fastify.get('/similar/:feedId', async (request, reply) => {
    const { feedId } = request.params as { feedId: string };
    const { limit } = z.object({ limit: z.coerce.number().default(10) }).parse(request.query);
    
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, feedId),
    });
    
    if (!feed) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    if (!feed.embedding) {
      return reply.status(400).send({ error: 'Feed has no embedding for similarity search' });
    }
    
    const results = await db
      .select({
        feed: feeds,
        similarity: sql<number>`1 - (${feeds.embedding} <=> ${JSON.stringify(feed.embedding)}::vector)`,
      })
      .from(feeds)
      .where(and(
        eq(feeds.status, 'active'),
        sql`${feeds.id} != ${feedId}`,
        sql`${feeds.embedding} IS NOT NULL`
      ))
      .orderBy(sql`${feeds.embedding} <=> ${JSON.stringify(feed.embedding)}::vector`)
      .limit(limit);
    
    return results.map(r => ({
      ...r.feed,
      similarity: r.similarity,
    }));
  });
}
