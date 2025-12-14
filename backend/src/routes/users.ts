import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, feeds, comments, proposals, votes, userFavorites } from '../db/schema/index.js';
import { eq, sql, desc } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
  // Get leaderboard
  fastify.get('/leaderboard', async (request) => {
    const { limit } = z.object({ limit: z.coerce.number().default(50) }).parse(request.query);
    
    const leaderboard = await db
      .select({
        user: {
          id: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          points: users.points,
          role: users.role,
        },
        feedsSubmitted: sql<number>`count(distinct ${feeds.id})::int`,
        commentsCount: sql<number>`count(distinct ${comments.id})::int`,
        proposalsCount: sql<number>`count(distinct ${proposals.id})::int`,
      })
      .from(users)
      .leftJoin(feeds, eq(users.id, feeds.submittedBy))
      .leftJoin(comments, eq(users.id, comments.userId))
      .leftJoin(proposals, eq(users.id, proposals.userId))
      .where(sql`${users.role} != 'admin'`)
      .groupBy(users.id)
      .orderBy(desc(users.points))
      .limit(limit);
    
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      user: entry.user,
      feedsSubmitted: entry.feedsSubmitted,
      commentsCount: entry.commentsCount,
      proposalsCount: entry.proposalsCount,
    }));
  });
  
  // Get user profile
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    // Get stats using separate count queries to avoid issues with multiple LEFT JOINs
    const [[feedsCount], [commentsCount], [proposalsCount], [votesCount]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(feeds).where(eq(feeds.submittedBy, id)),
      db.select({ count: sql<number>`count(*)::int` }).from(comments).where(eq(comments.userId, id)),
      db.select({ count: sql<number>`count(*)::int` }).from(proposals).where(eq(proposals.userId, id)),
      db.select({ count: sql<number>`count(*)::int` }).from(votes).where(eq(votes.userId, id)),
    ]);
    
    // Calculate rank
    const [rankResult] = await db
      .select({
        rank: sql<number>`(SELECT COUNT(*) + 1 FROM users u2 WHERE u2.points > ${user.points} AND u2.role != 'admin')::int`,
      })
      .from(users)
      .where(eq(users.id, id));
    
    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      points: user.points,
      createdAt: user.createdAt,
      stats: {
        feedsSubmitted: feedsCount?.count || 0,
        commentsCount: commentsCount?.count || 0,
        proposalsCount: proposalsCount?.count || 0,
        votesCast: votesCount?.count || 0,
      },
      rank: rankResult?.rank || 0,
    };
  });
  
  // Update own profile
  fastify.patch('/me', { preHandler: authenticate }, async (request) => {
    const body = updateProfileSchema.parse(request.body);
    const userId = request.user.userId;
    
    const [user] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      points: user.points,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });
  
  // Get user's submitted feeds
  fastify.get('/:id/feeds', async (request) => {
    const { id } = request.params as { id: string };
    const { page, pageSize } = z.object({
      page: z.coerce.number().default(1),
      pageSize: z.coerce.number().default(20),
    }).parse(request.query);
    
    const offset = (page - 1) * pageSize;
    
    const userFeeds = await db.query.feeds.findMany({
      where: eq(feeds.submittedBy, id),
      orderBy: [desc(feeds.createdAt)],
      limit: pageSize,
      offset,
    });
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(feeds)
      .where(eq(feeds.submittedBy, id));
    
    return {
      data: userFeeds,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  });
  
  // Get user's favorites
  fastify.get('/me/favorites', { preHandler: authenticate }, async (request) => {
    const userId = request.user.userId;
    const { page, pageSize } = z.object({
      page: z.coerce.number().default(1),
      pageSize: z.coerce.number().default(20),
    }).parse(request.query);
    
    const offset = (page - 1) * pageSize;
    
    const favorites = await db.query.userFavorites.findMany({
      where: eq(userFavorites.userId, userId),
      with: { feed: true },
      orderBy: [desc(userFavorites.createdAt)],
      limit: pageSize,
      offset,
    });
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));
    
    return {
      data: favorites.map(f => f.feed),
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  });
}
