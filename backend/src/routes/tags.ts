import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { tags, feedTags } from '../db/schema/index.js';
import { eq, sql, desc, ilike } from 'drizzle-orm';
import { requireAdmin } from '../middleware/auth.js';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

const querySchema = z.object({
  query: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export async function tagRoutes(fastify: FastifyInstance) {
  // Get all tags (with optional search)
  fastify.get('/', async (request) => {
    const { query, limit } = querySchema.parse(request.query);
    
    const baseQuery = db
      .select({
        tag: tags,
        feedCount: sql<number>`count(${feedTags.feedId})::int`,
      })
      .from(tags)
      .leftJoin(feedTags, eq(tags.id, feedTags.tagId));
    
    const results = query
      ? await baseQuery
          .where(ilike(tags.name, `%${query}%`))
          .groupBy(tags.id)
          .orderBy(desc(tags.usageCount))
          .limit(limit)
      : await baseQuery
          .groupBy(tags.id)
          .orderBy(desc(tags.usageCount))
          .limit(limit);
    
    return results.map(({ tag, feedCount }) => ({
      ...tag,
      feedCount,
    }));
  });
  
  // Get popular tags
  fastify.get('/popular', async (request) => {
    const { limit } = z.object({ limit: z.coerce.number().default(20) }).parse(request.query);
    
    const results = await db
      .select({
        tag: tags,
        feedCount: sql<number>`count(${feedTags.feedId})::int`,
      })
      .from(tags)
      .leftJoin(feedTags, eq(tags.id, feedTags.tagId))
      .groupBy(tags.id)
      .orderBy(desc(tags.usageCount))
      .limit(limit);
    
    return results.map(({ tag, feedCount }) => ({
      ...tag,
      feedCount,
    }));
  });
  
  // Get tag by slug
  fastify.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    
    const [result] = await db
      .select({
        tag: tags,
        feedCount: sql<number>`count(${feedTags.feedId})::int`,
      })
      .from(tags)
      .leftJoin(feedTags, eq(tags.id, feedTags.tagId))
      .where(eq(tags.slug, slug))
      .groupBy(tags.id);
    
    if (!result) {
      return reply.status(404).send({ error: 'Tag not found' });
    }
    
    return {
      ...result.tag,
      feedCount: result.feedCount,
    };
  });
  
  // Create tag (admin only)
  fastify.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = createTagSchema.parse(request.body);
    
    const existing = await db.query.tags.findFirst({
      where: eq(tags.slug, body.slug),
    });
    
    if (existing) {
      return reply.status(400).send({ error: 'Tag slug already exists' });
    }
    
    const [tag] = await db.insert(tags).values(body).returning();
    return tag;
  });
  
  // Delete tag (admin only)
  fastify.delete('/:id', { preHandler: requireAdmin }, async (request, _reply) => {
    const { id } = request.params as { id: string };
    
    await db.delete(feedTags).where(eq(feedTags.tagId, id));
    await db.delete(tags).where(eq(tags.id, id));
    
    return { success: true };
  });
}
