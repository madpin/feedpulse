import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db } from '../db/index.js';
import { users, userSessions } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

// Emails that should always have admin role
const ADMIN_EMAILS = ['madpin@gmail.com'];

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    
    // Check if user exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });
    
    if (existing) {
      return reply.status(400).send({ error: 'Email already registered' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12);
    
    // Determine role - auto-admin for specific emails
    const role = ADMIN_EMAILS.includes(body.email.toLowerCase()) ? 'admin' : 'user';
    
    // Create user
    const [user] = await db.insert(users).values({
      email: body.email,
      passwordHash,
      displayName: body.displayName,
      role,
    }).returning();
    
    // Generate tokens
    const accessToken = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    const refreshToken = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    
    // Store session
    await db.insert(userSessions).values({
      userId: user.id,
      refreshTokenHash,
      userAgent: request.headers['user-agent'] || null,
      ipAddress: request.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        points: user.points,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  });
  
  // Login
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });
    
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(body.password, user.passwordHash);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    const refreshToken = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    
    // Store session
    await db.insert(userSessions).values({
      userId: user.id,
      refreshTokenHash,
      userAgent: request.headers['user-agent'] || null,
      ipAddress: request.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        points: user.points,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  });
  
  // Refresh token
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    
    if (!refreshToken) {
      return reply.status(400).send({ error: 'Refresh token required' });
    }
    
    // Find valid sessions
    const sessions = await db.query.userSessions.findMany({
      where: (s, { gt }) => gt(s.expiresAt, new Date()),
      with: { user: true },
    });
    
    // Find matching session
    let validSession = null;
    for (const session of sessions) {
      const valid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (valid) {
        validSession = session;
        break;
      }
    }
    
    if (!validSession) {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
    
    const sessionUser = validSession.user as { id: string; email: string; role: string };
    
    // Generate new access token
    const accessToken = fastify.jwt.sign({
      userId: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
    });
    
    // Update last used
    await db.update(userSessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(userSessions.id, validSession.id));
    
    return { accessToken };
  });
  
  // Logout
  fastify.post('/logout', { preHandler: authenticate }, async (request, _reply) => {
    // Delete all sessions for user (or specific session if provided)
    await db.delete(userSessions)
      .where(eq(userSessions.userId, request.user.userId));
    
    return { success: true };
  });
  
  // Get current user
  fastify.get('/me', { preHandler: authenticate }, async (request) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user.userId),
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      points: user.points,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });
}
