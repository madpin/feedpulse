# Feedpulse 🫀

**The Yellow Pages for RSS Feeds**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Feedpulse is a community-curated, open-source directory of RSS feeds designed to restore power to users in an era of algorithmic feeds. Think of it as the Yellow Pages for the open web—a transparent, searchable, and continuously health-checked index of independent content sources.

## 🎯 Why Feedpulse?

Most RSS directories are graveyards of dead links and SEO spam. Feedpulse is different:

- **Living Index**: Every feed has a real-time "Pulse Score" (0-100) based on posting frequency, longevity, and server reliability
- **AI-Powered Discovery**: Semantic search and auto-generated summaries help you find content by meaning, not just keywords
- **Community-Driven**: Democratic curation through GitHub IssueOps—no single gatekeeper controls the index
- **Public Data**: The entire directory is available as open data for developers to build upon

## ✨ Key Features

### 🩺 The Alive Index

- **Pulse Score**: Every feed gets a health score so you can filter for active content
- **The Graveyard**: Inactive feeds (404s, DNS failures) are automatically archived after 14 days—preserving internet history without cluttering search results
- **Sparklines**: Visual posting frequency graphs show you at a glance whether it's a daily news site or monthly essayist

### 🤖 AI-Powered Intelligence

- **"What's This About?" Summaries**: LLM-generated 2-sentence summaries of recent content
- **Semantic Categorization**: Auto-tagging with granular topics (DevOps, Cybersecurity, Frontend, etc.)
- **Vibe Check**: Sentiment indicators like "Highly Technical," "Opinionated/Editorial," "Tutorial Focused"
- **Similar Feeds**: Vector embeddings power intelligent recommendations

### 🌐 Community Governance

- **Submit via GitHub**: Simple issue-based submission workflow
- **Public Validation**: Community upvotes/downvotes before merging
- **Verified Badge**: Feed authors can claim ownership via meta tag or DNS record

### 🔍 Discovery & Export

- **Smart Search**: Fuzzy search that indexes titles, descriptions, and AI-generated summaries
- **Curated Collections**: Pre-made bundles like "Indie Web Starter Pack" or "Slow Web / Long-form Essays"
- **"Surprise Me" Button**: StumbleUpon-style random feed discovery
- **One-Click Subscribe**: Specialized buttons for Feedly, Inoreader, NewsBlur, NetNewsWire
- **OPML Export**: Build a "shopping cart" and export for your favorite RSS reader
- **The Firehose**: Complete directory available as public JSON API

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend UI   │────▶│   Backend API    │────▶│   PostgreSQL    │
│  (Next.js/React)│     │  (FastAPI/Django)│     │   + Redis Cache │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         ▲
        │                        ▼                         │
        │               ┌───────────────────┐              │
        │               │ Background Workers│──────────────┘
        │               │  (Celery/BullMQ)  │
        │               └───────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  GitHub IssueOps│     │    AI Pipeline   │
│      Bot        │     │  (OpenAI/Claude) │
└─────────────────┘     └──────────────────┘
```

### Core Components

- **Frontend**: Next.js 14+ with App Router, Tailwind CSS, Radix UI
- **Backend API**: FastAPI (Python) with async support
- **Database**: PostgreSQL with pgvector extension for semantic search
- **Task Queue**: Celery with Redis for background jobs
- **AI/ML**: OpenAI GPT-4 or Claude API for content analysis
- **Infrastructure**: Docker, Kubernetes/ECS, GitHub Actions CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)

### Local Development with Docker

```bash
# Clone the repository
git clone https://github.com/madpin/feedpulse.git
cd feedpulse

# Start all services
docker-compose up -d

# The frontend will be available at http://localhost:3000
# The API will be available at http://localhost:8000
```

### Manual Setup

#### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Run migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start the development server
npm run dev
```

#### Background Workers

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Start Celery worker
celery -A app.workers worker --loglevel=info

# Start Celery beat (scheduler)
celery -A app.workers beat --loglevel=info
```

## 📊 Operational Workflows

### Daily Health Check (Every 6 hours)

- Pings every RSS URL in the database
- Collects metrics: HTTP status, latency, last build date, post count
- Flags feeds as "Unhealthy" after 10 consecutive failures
- Auto-moves to Graveyard after 14 days of downtime

### Content Analysis (Daily, AI-powered)

- Triggers only when new articles are detected
- Generates 50-word summaries of recent topics
- Extracts 5 key topic tags
- Creates vector embeddings for "Similar Feeds" recommendations
- Cost-controlled: processes top 20% most active feeds or uses cheaper models

### Community Submission (IssueOps)

1. User opens "New Feed Request" GitHub Issue
2. Bot validates URL, checks for duplicates, previews feed
3. Community reviews and maintainer approves with `/approve`
4. System auto-commits to `feeds.json` and closes issue

## 🤝 Contributing

We welcome contributions! Feedpulse is built by the community, for the community.

### Ways to Contribute

- **Submit Feeds**: Open an issue to suggest RSS feeds for inclusion
- **Report Issues**: Found a bug or dead link? Let us know
- **Code Contributions**: Check our [open issues](https://github.com/madpin/feedpulse/issues)
- **Documentation**: Help improve guides and documentation
- **Curated Collections**: Propose new themed feed collections

### Submission Guidelines

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

Quick checklist for feed submissions:
- ✅ Valid RSS/Atom feed URL
- ✅ Active (posted within last 90 days)
- ✅ Not spam or pure promotional content
- ✅ Unique (not already in directory)

## 📚 Documentation

- [Technical Implementation Plan](technical-implementation-plan.md)
- [API Documentation](docs/api.md) (coming soon)
- [Deployment Guide](docs/deployment.md) (coming soon)
- [Architecture Deep Dive](docs/architecture.md) (coming soon)

## 🛣️ Roadmap

### Current Phase: Foundation (Weeks 1-4)
- [x] Technical planning
- [ ] Database architecture
- [ ] API foundation
- [ ] Frontend foundation
- [ ] Development environment setup

### Future Phases
- **Phase 2**: Core features (search, health checks, feed display)
- **Phase 3**: AI intelligence layer
- **Phase 4**: Community tools and collections
- **Phase 5**: Production deployment

### Future Ideas
- Newsletter-to-RSS bridge
- Webmentions integration
- Personalized daily digest pages
- Browser extensions
- Mobile app

## 📈 Success Metrics

### Technical KPIs
- API response time < 200ms (p95)
- Feed health check coverage > 95%
- Search relevance score > 80%
- System uptime > 99.9%

### Product KPIs
- Active feeds in directory > 10,000
- Daily health checks completed > 95%
- Search queries per day > 1,000
- OPML exports per week > 100

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the open web, RSS renaissance, and the indie web movement
- Built with modern tools but honoring the spirit of Web 1.0
- Thanks to all contributors and the RSS community

## 🔗 Links

- **Website**: [feedpulse.org](https://feedpulse.org) (coming soon)
- **GitHub**: [github.com/yourusername/feedpulse](https://github.com/madpin/feedpulse)
- **Discussions**: [GitHub Discussions](https://github.com/madpin/feedpulse/discussions)
- **Twitter/X**: [@feedpulse](https://twitter.com/feedpulse)

## 💬 Community

Join the conversation:
- Open an [issue](https://github.com/madpin/feedpulse/issues) for bugs or feature requests
- Start a [discussion](https://github.com/madpin/feedpulse/discussions) for questions or ideas
- Follow our [blog](https://feedpulse.org/blog) for updates (coming soon)

---

**Made with 🫀 by the open web community**

*"In a world of algorithmic feeds, choose your own sources."*

