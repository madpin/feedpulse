import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { categories, feedCategories, feeds } from '../db/schema/index.js';
import { eq, sql, isNull } from 'drizzle-orm';
import { requireAdmin } from '../middleware/auth.js';

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export async function categoryRoutes(fastify: FastifyInstance) {
  // Get all categories with feed counts (only counting active feeds)
  fastify.get('/', async () => {
    const cats = await db
      .select({
        category: categories,
        feedCount: sql<number>`count(CASE WHEN ${feeds.status} = 'active' THEN 1 END)::int`,
      })
      .from(categories)
      .leftJoin(feedCategories, eq(categories.id, feedCategories.categoryId))
      .leftJoin(feeds, eq(feedCategories.feedId, feeds.id))
      .groupBy(categories.id)
      .orderBy(categories.name);
    
    return cats.map(({ category, feedCount }) => ({
      ...category,
      feedCount,
    }));
  });
  
  // Get top-level categories (no parent) - only counting active feeds
  fastify.get('/root', async () => {
    const cats = await db
      .select({
        category: categories,
        feedCount: sql<number>`count(CASE WHEN ${feeds.status} = 'active' THEN 1 END)::int`,
      })
      .from(categories)
      .leftJoin(feedCategories, eq(categories.id, feedCategories.categoryId))
      .leftJoin(feeds, eq(feedCategories.feedId, feeds.id))
      .where(isNull(categories.parentId))
      .groupBy(categories.id)
      .orderBy(categories.name);
    
    return cats.map(({ category, feedCount }) => ({
      ...category,
      feedCount,
    }));
  });
  
  // Get category by slug - only counting active feeds
  fastify.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    
    const [result] = await db
      .select({
        category: categories,
        feedCount: sql<number>`count(CASE WHEN ${feeds.status} = 'active' THEN 1 END)::int`,
      })
      .from(categories)
      .leftJoin(feedCategories, eq(categories.id, feedCategories.categoryId))
      .leftJoin(feeds, eq(feedCategories.feedId, feeds.id))
      .where(eq(categories.slug, slug))
      .groupBy(categories.id);
    
    if (!result) {
      return reply.status(404).send({ error: 'Category not found' });
    }
    
    // Get children - only counting active feeds
    const children = await db
      .select({
        category: categories,
        feedCount: sql<number>`count(CASE WHEN ${feeds.status} = 'active' THEN 1 END)::int`,
      })
      .from(categories)
      .leftJoin(feedCategories, eq(categories.id, feedCategories.categoryId))
      .leftJoin(feeds, eq(feedCategories.feedId, feeds.id))
      .where(eq(categories.parentId, result.category.id))
      .groupBy(categories.id)
      .orderBy(categories.name);
    
    return {
      ...result.category,
      feedCount: result.feedCount,
      children: children.map(({ category, feedCount }) => ({
        ...category,
        feedCount,
      })),
    };
  });
  
  // Create category (admin only)
  fastify.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = createCategorySchema.parse(request.body);
    
    // Check if slug exists
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, body.slug),
    });
    
    if (existing) {
      return reply.status(400).send({ error: 'Category slug already exists' });
    }
    
    const [category] = await db.insert(categories).values(body).returning() as [typeof categories.$inferSelect];
    return category;
  });
  
  // Update category (admin only)
  fastify.patch('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createCategorySchema.partial().parse(request.body);
    
    const [category] = await db
      .update(categories)
      .set(body)
      .where(eq(categories.id, id))
      .returning();
    
    if (!category) {
      return reply.status(404).send({ error: 'Category not found' });
    }
    
    return category;
  });
  
  // Delete category (admin only)
  fastify.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    // Check if category has feeds
    const feedCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedCategories)
      .where(eq(feedCategories.categoryId, id));
    
    if (feedCount[0].count > 0) {
      return reply.status(400).send({ 
        error: 'Cannot delete category with feeds. Remove feeds first.' 
      });
    }
    
    await db.delete(categories).where(eq(categories.id, id));
    return { success: true };
  });
}
