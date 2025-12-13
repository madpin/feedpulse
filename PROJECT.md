# FeedPulse: Project Requirements Document

## Project Overview

**FeedPulse** is a community-driven RSS feed discovery and cataloging platform that serves as a comprehensive "yellow pages" for RSS feeds. The platform leverages Large Language Models (LLMs) to automate feed analysis, categorization, and content tracking while enabling community contributions through a gamified user system.

## Core Purpose

FeedPulse centralizes RSS feed discovery by automatically analyzing feed content, tracking publishing patterns, generating statistics, and organizing feeds into searchable categories. The platform emphasizes automation through LLM integration while maintaining human oversight through community contributions and admin moderation.

## Key Features

### Automated Feed Analysis

**LLM-Powered Data Extraction**: The only mandatory input is the RSS feed URL. All other metadata (description, categories, content type, posting frequency) is automatically extracted and analyzed by LLM.

**Content Intelligence**: The system analyzes what feeds typically post about, automatically assigns categories based on content patterns, and preserves existing feed categories when available.

**Readability Integration**: For incomplete or truncated feed entries, the platform uses Readability.js to fetch and parse full article content from source URLs. Admins can toggle this feature on/off globally or per feed.

**Statistical Tracking**: Monitors posts per week, content type distribution, publishing frequency patterns, and historical posting behavior.

**Feed History & Analytics**: Comprehensive historical tracking including:
- First post date (when the feed started publishing)
- Total posts tracked over time
- Daily post counts for trend analysis
- Posts per day/week/month averages
- Activity streaks and gaps
- Historical posting patterns visualization

### Update System

**Scheduled Updates**: Automated daily updates run for all feeds at configurable intervals.

**On-Demand Updates**: Admins can trigger manual updates for individual feeds or bulk updates for all feeds with sequential processing to prevent system overload.

**Smart Processing**: Updates execute one feed at a time to maintain system stability and prevent API rate limiting.

### Search and Discovery

**Similarity Matching**: LLM-powered search finds similar feeds based on content descriptions, topics, and categories.

**Advanced Filtering**: Users can search by category, posting frequency, content type, and community ratings.

### Community Features

**User Roles and Permissions**:
- **Guest** (no login): Browse feeds, view statistics, and search the directory
- **User** (authenticated): Submit new feeds, propose edits, upvote/downvote feeds, and comment on feeds
- **Contributor**: Open proposals for new features or changes, participate in community voting, and implement approved changes with majority vote
- **Admin**: Override any information, approve/reject proposals, manage users, and configure system settings

**Data Precedence Model**: User-submitted data takes priority over LLM-generated data by default. Admins can remove user-submitted data to revert to LLM analysis or provide authoritative overrides.

**Gamification System**:
- Users earn points for adding new feeds (bonus points for feeds not yet in the database)
- Additional points for helpful comments, approved edits, and community contributions
- Score displayed on user profiles

**Voting System**: Community members can upvote/downvote feeds to indicate quality and relevance. Contributors can propose changes requiring majority approval for implementation.

**Approval Workflow**: Most archive/modification fields require admin approval before becoming permanent, preventing spam and maintaining data quality.

### User Profiles

Customizable profile pages include display name, avatar upload, bio/description, contribution history, point score/leaderboard ranking, and feeds submitted.

### Technical Architecture

**LLM Integration**: Heavy automation for content analysis, category assignment, description generation, and similarity matching.

**Content Parsing**: RSS feed parsing with optional Readability.js fallback for full content extraction when feed provides only excerpts.

**Database Design**: Stores feed metadata (URL, title, description, categories), statistics (posts per week, content types, update history), historical daily post counts, user data (profiles, scores, contributions), and voting/approval records.

**Update Queue**: Sequential processing system for managing daily automated updates and admin-triggered manual updates.

### Tech Stack

**Core:**
- JavaScript / Node.js - Runtime and language
- PostgreSQL with pgvector - Database with vector similarity search

**Parsing:**
- rss-parser - RSS/Atom feed parsing
- Readability - Article content extraction

**LLM & AI:**
- OpenAI via LiteLLM proxy - LLM provider
- LangChain.js - AI orchestration framework
- Models:
  - `gpt-5-mini` - Cost-effective categorization
  - `text-embedding-3-small` - Search similarity embeddings

## User Journey Examples

### New Feed Submission
1. User pastes RSS feed URL
2. LLM automatically extracts title, description, and categories
3. System analyzes recent posts for content patterns
4. User optionally overrides any auto-generated fields
5. Feed enters approval queue for admin review
6. User receives points upon approval

### Community Curation
1. User discovers outdated feed description
2. User proposes correction with supporting details
3. Other users vote on proposed change
4. Admin reviews and approves if voting threshold met
5. Contributor receives points for successful improvement

### Admin Management
1. Admin reviews pending feed submissions
2. Admin can accept, reject, or edit submissions
3. Admin configures global settings like Readability.js usage
4. Admin triggers on-demand updates for specific feeds
5. Admin moderates user contributions and manages permissions

## Success Metrics

- Number of feeds cataloged
- User engagement (submissions, votes, comments)
- Community contribution quality
- LLM accuracy for categorization
- Search relevance and discovery effectiveness
- User retention and point accumulation patterns

FeedPulse combines automated intelligence with community wisdom to create a comprehensive, constantly updated directory of RSS feeds that serves both casual readers and content professionals.
