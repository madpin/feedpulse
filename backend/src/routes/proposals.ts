import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { proposals, proposalVotes, feeds } from '../db/schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authenticate, requireContributor, requireAdmin } from '../middleware/auth.js';

const createProposalSchema = z.object({
  feedId: z.string().uuid().optional(),
  type: z.enum(['edit', 'feature', 'removal']),
  title: z.string().min(5).max(255),
  description: z.string().min(10),
  changes: z.record(z.unknown()).optional(),
});

const voteProposalSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1)]),
});

export async function proposalRoutes(fastify: FastifyInstance) {
  // Get all proposals
  fastify.get('/', async (request) => {
    const { page, pageSize, status, type } = z.object({
      page: z.coerce.number().default(1),
      pageSize: z.coerce.number().default(20),
      status: z.enum(['open', 'approved', 'rejected', 'implemented']).optional(),
      type: z.enum(['edit', 'feature', 'removal']).optional(),
    }).parse(request.query);
    
    const offset = (page - 1) * pageSize;
    
    const conditions = [];
    if (status) conditions.push(eq(proposals.status, status));
    if (type) conditions.push(eq(proposals.type, type));
    
    const proposalList = await db.query.proposals.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: {
          columns: { id: true, displayName: true, avatarUrl: true },
        },
        feed: {
          columns: { id: true, title: true, url: true },
        },
      },
      orderBy: [desc(proposals.createdAt)],
      limit: pageSize,
      offset,
    });
    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(proposals)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    return {
      data: proposalList,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  });
  
  // Get single proposal
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
      with: {
        user: {
          columns: { id: true, displayName: true, avatarUrl: true },
        },
        feed: true,
        reviewer: {
          columns: { id: true, displayName: true },
        },
      },
    });
    
    if (!proposal) {
      return reply.status(404).send({ error: 'Proposal not found' });
    }
    
    return proposal;
  });
  
  // Create proposal (contributors only)
  fastify.post('/', { preHandler: requireContributor }, async (request, reply) => {
    const body = createProposalSchema.parse(request.body);
    const userId = request.user.userId;
    
    // If feed proposal, check feed exists
    if (body.feedId) {
      const feed = await db.query.feeds.findFirst({
        where: eq(feeds.id, body.feedId),
      });
      
      if (!feed) {
        return reply.status(404).send({ error: 'Feed not found' });
      }
    }
    
    const [proposal] = await db.insert(proposals).values({
      feedId: body.feedId,
      userId,
      type: body.type,
      title: body.title,
      description: body.description,
      changes: body.changes,
    }).returning();
    
    return proposal;
  });
  
  // Vote on proposal
  fastify.post('/:id/vote', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = voteProposalSchema.parse(request.body);
    const userId = request.user.userId;
    
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
    });
    
    if (!proposal) {
      return reply.status(404).send({ error: 'Proposal not found' });
    }
    
    if (proposal.status !== 'open') {
      return reply.status(400).send({ error: 'Cannot vote on closed proposal' });
    }
    
    // Check existing vote
    const existingVote = await db.query.proposalVotes.findFirst({
      where: and(eq(proposalVotes.proposalId, id), eq(proposalVotes.userId, userId)),
    });
    
    if (existingVote) {
      if (existingVote.value === body.value) {
        // Remove vote
        await db.delete(proposalVotes)
          .where(and(eq(proposalVotes.proposalId, id), eq(proposalVotes.userId, userId)));
        
        // Update counts
        if (body.value === 1) {
          await db.update(proposals)
            .set({ votesFor: sql`${proposals.votesFor} - 1` })
            .where(eq(proposals.id, id));
        } else {
          await db.update(proposals)
            .set({ votesAgainst: sql`${proposals.votesAgainst} - 1` })
            .where(eq(proposals.id, id));
        }
        
        return { userVote: null };
      } else {
        // Change vote
        await db.update(proposalVotes)
          .set({ value: body.value })
          .where(and(eq(proposalVotes.proposalId, id), eq(proposalVotes.userId, userId)));
        
        if (body.value === 1) {
          await db.update(proposals)
            .set({ 
              votesFor: sql`${proposals.votesFor} + 1`,
              votesAgainst: sql`${proposals.votesAgainst} - 1`,
            })
            .where(eq(proposals.id, id));
        } else {
          await db.update(proposals)
            .set({ 
              votesFor: sql`${proposals.votesFor} - 1`,
              votesAgainst: sql`${proposals.votesAgainst} + 1`,
            })
            .where(eq(proposals.id, id));
        }
        
        return { userVote: body.value };
      }
    } else {
      // New vote
      await db.insert(proposalVotes).values({
        proposalId: id,
        userId,
        value: body.value,
      });
      
      if (body.value === 1) {
        await db.update(proposals)
          .set({ votesFor: sql`${proposals.votesFor} + 1` })
          .where(eq(proposals.id, id));
      } else {
        await db.update(proposals)
          .set({ votesAgainst: sql`${proposals.votesAgainst} + 1` })
          .where(eq(proposals.id, id));
      }
      
      return { userVote: body.value };
    }
  });
  
  // Review proposal (admin only)
  fastify.post('/:id/review', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = z.object({
      status: z.enum(['approved', 'rejected', 'implemented']),
    }).parse(request.body);
    const userId = request.user.userId;
    
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
    });
    
    if (!proposal) {
      return reply.status(404).send({ error: 'Proposal not found' });
    }
    
    const [updated] = await db.update(proposals)
      .set({
        status,
        reviewedBy: userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, id))
      .returning();
    
    return updated;
  });
}
