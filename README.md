# FeedPulse

A community-driven RSS feed discovery and cataloging platform that serves as a comprehensive "yellow pages" for RSS feeds. The platform leverages LLMs to automate feed analysis, categorization, and content tracking while enabling community contributions through a gamified user system.

## Features

- **Automated Feed Analysis**: LLM-powered content analysis, categorization, and description generation
- **Community Features**: User submissions, voting, comments, and proposals
- **Gamification**: Points system with leaderboards
- **Semantic Search**: Vector similarity search using pgvector
- **Admin Dashboard**: Feed moderation, user management, and system settings

## Tech Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL 16 with pgvector
- **ORM**: Drizzle ORM
- **Queue**: BullMQ with Redis
- **LLM**: OpenAI via LangChain.js
- **RSS**: rss-parser, @mozilla/readability

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **State**: Zustand
- **Icons**: Lucide React

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- OpenAI API key

### 1. Clone and Setup

```bash
cd feedpulse

# Copy environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# Also update JWT secrets for production!
```

### 2. Start with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker compose up -d

# View logs
docker compose logs -f
```

Services will be available at:
- **Frontend**: http://localhost:3737
- **Backend API**: http://localhost:3838
- **PostgreSQL**: localhost:5454
- **Redis**: localhost:6399

### 3. Install Dependencies (for local dev)

```bash
npm install          # Install root dependencies (concurrently)
npm run install:all  # Install backend + frontend dependencies
```

### 4. Initialize Database

```bash
# Run migrations
npm run db:migrate

# Seed initial data (categories, tags, admin user)
npm run db:seed
```

Default credentials:
- **Admin**: admin@feedpulse.com / admin123
- **Demo User**: demo@feedpulse.com / demo123

## Local Development

All commands can be run from the project root:

```bash
# Start PostgreSQL and Redis
npm run docker:up   # or: docker compose up -d postgres redis

# Install all dependencies
npm install
npm run install:all

# Initialize database
npm run db:migrate
npm run db:seed

# Start both backend and frontend
npm run dev

# Or start them separately
npm run dev:backend
npm run dev:frontend

# Start the feed worker (in another terminal)
npm run worker
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run dev:backend` | Start only backend |
| `npm run dev:frontend` | Start only frontend |
| `npm run worker` | Start feed update worker |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |
| `npm run docker:logs` | View Docker logs |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Feeds
- `GET /api/feeds` - List feeds (with filtering)
- `GET /api/feeds/:id` - Get feed details
- `POST /api/feeds` - Submit new feed
- `POST /api/feeds/:id/favorite` - Toggle favorite
- `GET /api/feeds/:id/history` - Get feed statistics

### Categories & Tags
- `GET /api/categories` - List categories
- `GET /api/categories/:slug` - Get category with children
- `GET /api/tags` - List tags
- `GET /api/tags/popular` - Get popular tags

### Users
- `GET /api/users/leaderboard` - Get leaderboard
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/me` - Update own profile
- `GET /api/users/me/favorites` - Get favorites

### Votes & Comments
- `POST /api/votes` - Vote on feed
- `GET /api/comments/feed/:feedId` - Get comments
- `POST /api/comments` - Create comment

### Search
- `GET /api/search?query=...` - Text search
- `GET /api/search?query=...&semantic=true` - Semantic search
- `GET /api/search/similar/:feedId` - Find similar feeds

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/feeds/pending` - Pending feeds
- `POST /api/admin/feeds/:id/review` - Approve/reject feed
- `POST /api/admin/feeds/update-all` - Trigger bulk update

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `BACKEND_PORT` | Backend API port | 3838 |
| `FRONTEND_PORT` | Frontend port | 3737 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_BASE_URL` | OpenAI API base URL | https://api.openai.com/v1 |
| `LLM_MODEL` | LLM model for analysis | gpt-4o-mini |
| `EMBEDDING_MODEL` | Embedding model | text-embedding-3-small |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3737 |

## Deployment

### Railpack / Railway / Render

The project is configured for easy deployment:

1. Set environment variables in your platform
2. Deploy backend and frontend as separate services
3. Use managed PostgreSQL with pgvector support
4. Use managed Redis for the job queue

### Docker Production Build

```bash
# Build production images
docker compose -f docker-compose.yml build

# Start in production mode
NODE_ENV=production docker compose up -d
```

## Project Structure

```
feedpulse/
├── backend/
│   ├── src/
│   │   ├── config/         # Environment config
│   │   ├── db/             # Drizzle schema & migrations
│   │   ├── lib/            # LLM, RSS parser utilities
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── workers/        # Background job workers
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # API client, utilities
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## License

MIT
