import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env - try multiple locations
// 1. Project root (when running from root with --prefix)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// 2. Backend directory (when running from backend/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// 3. Project root from backend (../../.env from backend/src/config)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // Server
  BACKEND_PORT: z.coerce.number().default(3838),
  BACKEND_HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  
  // Feed Processing
  FEED_UPDATE_INTERVAL_HOURS: z.coerce.number().default(1),
  USE_READABILITY_DEFAULT: z.coerce.boolean().default(true),
  MAX_CONCURRENT_FEED_UPDATES: z.coerce.number().default(5),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3737'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
