# FeedPulse Frontend

A modern, community-driven RSS feed discovery platform built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- **Feed Discovery** - Browse, search, and filter RSS feeds by category, tag, or content type
- **Community Voting** - Upvote/downvote feeds to surface quality content
- **User Profiles** - Track contributions, points, and activity
- **Gamification** - Earn points for submitting feeds, comments, and proposals
- **Admin Dashboard** - Manage feed submissions, users, and proposals
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: Zustand
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── category/[slug]/   # Category pages
│   ├── discover/          # Feed discovery with filters
│   ├── favorites/         # User's favorited feeds
│   ├── feed/[id]/         # Feed detail page
│   ├── leaderboard/       # Community leaderboard
│   ├── profile/[id]/      # User profiles
│   ├── recent/            # Recently added feeds
│   ├── search/            # Search results
│   ├── settings/          # User settings
│   ├── tag/[slug]/        # Tag pages
│   ├── tags/              # All tags
│   └── trending/          # Trending feeds
├── components/
│   ├── auth/              # Auth modals (login, register, submit feed)
│   ├── feeds/             # Feed card and list components
│   ├── layout/            # Header, footer, sidebar
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── mock-data.ts       # Mock data for development
│   └── utils.ts           # Utility functions
├── store/
│   └── index.ts           # Zustand stores
└── types/
    └── index.ts           # TypeScript type definitions
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with trending feeds and categories |
| `/discover` | Browse all feeds with search and filters |
| `/categories` | Browse all categories |
| `/category/[slug]` | Feeds in a specific category |
| `/tag/[slug]` | Feeds with a specific tag |
| `/tags` | All tags |
| `/feed/[id]` | Feed detail with comments |
| `/trending` | Trending feeds by score |
| `/recent` | Recently added feeds |
| `/favorites` | User's favorited feeds |
| `/leaderboard` | Community leaderboard |
| `/profile/[id]` | User profile |
| `/settings` | User settings |
| `/search` | Search results |
| `/admin` | Admin dashboard (admin only) |

## Mock Data

The frontend uses mock data for development. The mock data includes:

- **10 active feeds** with realistic metadata
- **2 pending feeds** for admin review
- **5 users** with different roles (admin, contributor, user)
- **15 categories** with hierarchical structure
- **12 tags** for feed classification
- **Comments and proposals** for community features

## User Roles

| Role | Permissions |
|------|-------------|
| Guest | Browse feeds, search, view profiles |
| User | Submit feeds, vote, comment, favorite |
| Contributor | Create proposals, vote on proposals |
| Admin | Approve/reject feeds, manage users, access dashboard |

## Development Notes

- **State Management**: Zustand stores handle auth, notifications, feeds, and UI state
- **Mock Backend**: All data operations are mocked with simulated delays
- **Responsive**: Mobile-first design with sidebar hidden on smaller screens
- **Dark Mode Ready**: Uses CSS variables for theming (can be extended)

## Next Steps (Backend Integration)

When connecting to a real backend:

1. Replace mock data imports with API calls
2. Implement actual authentication (JWT, OAuth, etc.)
3. Add API routes or connect to external API
4. Implement real-time updates for votes/comments
5. Add proper error handling and loading states

## License

MIT
