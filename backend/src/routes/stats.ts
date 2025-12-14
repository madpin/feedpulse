import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { feeds, users, categories } from '../db/schema/index.js';
import { sql } from 'drizzle-orm';

export async function statsRoutes(fastify: FastifyInstance) {
  // Public stats endpoint
  fastify.get('/', async () => {
    const [feedStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where status = 'active')::int`,
      })
      .from(feeds);
    
    const [userStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
      })
      .from(users);
    
    const [categoryStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
      })
      .from(categories);
    
    return {
      feeds: feedStats.active,
      users: userStats.total,
      categories: categoryStats.total,
    };
  });
}
