import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { comments, feeds } from '../db/schema/index.js';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';

const createCommentSchema = z.object({
  feedId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function commentRoutes(fastify: FastifyInstance) {
  // Get comments for a feed
  fastify.get('/feed/:feedId', async (request) => {
    const { feedId } = request.params as { feedId: string };
    const { page, pageSize } = z.object({
      page: z.coerce.number().default(1),
      pageSize: z.coerce.number().default(20),
    }).parse(request.query);
    
    const offset = (page - 1) * pageSize;
    
    // Get top-level comments
    const topLevelComments = await db.query.comments.findMany({
      where: and(eq(comments.feedId, feedId), isNull(comments.parentId)),
      with: {
        user: {
          columns: { id: true, displayName: true, avatarUrl: true, role: true },
        },
        replies: {
          with: {
            user: {
              columns: { id: true, displayName: true, avatarUrl: true, role: true },
            },
          },
          orderBy: [comments.createdAt],
        },
      },
      orderBy: [desc(comments.createdAt)],
      limit: pageSize,
      offset,
    });
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(and(eq(comments.feedId, feedId), isNull(comments.parentId)));
    
    return {
      data: topLevelComments,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  });
  
  // Create comment
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const body = createCommentSchema.parse(request.body);
    const userId = request.user.userId;
    
    // Check if feed exists
    const feed = await db.query.feeds.findFirst({
      where: eq(feeds.id, body.feedId),
    });
    
    if (!feed) {
      return reply.status(404).send({ error: 'Feed not found' });
    }
    
    // If replying, check parent exists
    if (body.parentId) {
      const parent = await db.query.comments.findFirst({
        where: eq(comments.id, body.parentId),
      });
      
      if (!parent) {
        return reply.status(404).send({ error: 'Parent comment not found' });
      }
    }
    
    const [comment] = await db.insert(comments).values({
      feedId: body.feedId,
      userId,
      content: body.content,
      parentId: body.parentId,
    }).returning() as [typeof comments.$inferSelect];
    
    // Get comment with user
    const commentWithUser = await db.query.comments.findFirst({
      where: eq(comments.id, comment.id),
      with: {
        user: {
          columns: { id: true, displayName: true, avatarUrl: true, role: true },
        },
      },
    });
    
    return commentWithUser;
  });
  
  // Update comment
  fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateCommentSchema.parse(request.body);
    const userId = request.user.userId;
    
    // Check ownership
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, id),
    });
    
    if (!comment) {
      return reply.status(404).send({ error: 'Comment not found' });
    }
    
    if (comment.userId !== userId && request.user.role !== 'admin') {
      return reply.status(403).send({ error: 'Not authorized to edit this comment' });
    }
    
    const [updated] = await db.update(comments)
      .set({ content: body.content, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    
    return updated;
  });
  
  // Delete comment
  fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.userId;
    
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, id),
    });
    
    if (!comment) {
      return reply.status(404).send({ error: 'Comment not found' });
    }
    
    if (comment.userId !== userId && request.user.role !== 'admin') {
      return reply.status(403).send({ error: 'Not authorized to delete this comment' });
    }
    
    await db.delete(comments).where(eq(comments.id, id));
    return { success: true };
  });
}
