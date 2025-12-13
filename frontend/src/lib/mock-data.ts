import type {
  User,
  Category,
  Tag,
  Feed,
  FeedPost,
  Comment,
  Proposal,
  Notification,
  LeaderboardEntry,
  FeedHistorySummary,
  FeedDailyStats,
} from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@feedpulse.com',
    displayName: 'Admin User',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    bio: 'FeedPulse administrator and RSS enthusiast.',
    role: 'admin',
    points: 5000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'jane@example.com',
    displayName: 'Jane Smith',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    bio: 'Tech blogger and feed curator. Love discovering new content sources!',
    role: 'contributor',
    points: 2450,
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-12-10T00:00:00Z',
  },
  {
    id: '3',
    email: 'john@example.com',
    displayName: 'John Doe',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    bio: 'Software developer interested in tech news and programming blogs.',
    role: 'user',
    points: 890,
    createdAt: '2024-03-20T00:00:00Z',
    updatedAt: '2024-12-08T00:00:00Z',
  },
  {
    id: '4',
    email: 'alice@example.com',
    displayName: 'Alice Johnson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    bio: 'Data scientist and AI researcher.',
    role: 'contributor',
    points: 1820,
    createdAt: '2024-04-10T00:00:00Z',
    updatedAt: '2024-12-05T00:00:00Z',
  },
  {
    id: '5',
    email: 'bob@example.com',
    displayName: 'Bob Wilson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    bio: 'Podcast enthusiast and content creator.',
    role: 'user',
    points: 560,
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
];

// Mock Categories
export const mockCategories: Category[] = [
  { id: '1', name: 'Technology', slug: 'technology', description: 'Tech news, programming, and software development', feedCount: 156 },
  { id: '2', name: 'Programming', slug: 'programming', description: 'Coding tutorials and programming languages', parentId: '1', feedCount: 89 },
  { id: '3', name: 'Web Development', slug: 'web-development', description: 'Frontend, backend, and full-stack development', parentId: '2', feedCount: 67 },
  { id: '4', name: 'AI & Machine Learning', slug: 'ai-ml', description: 'Artificial intelligence and machine learning', parentId: '1', feedCount: 45 },
  { id: '5', name: 'News', slug: 'news', description: 'General news and current events', feedCount: 234 },
  { id: '6', name: 'World News', slug: 'world-news', description: 'International news coverage', parentId: '5', feedCount: 78 },
  { id: '7', name: 'Science', slug: 'science', description: 'Scientific discoveries and research', feedCount: 112 },
  { id: '8', name: 'Business', slug: 'business', description: 'Business news and entrepreneurship', feedCount: 98 },
  { id: '9', name: 'Finance', slug: 'finance', description: 'Financial markets and investing', parentId: '8', feedCount: 56 },
  { id: '10', name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, and pop culture', feedCount: 145 },
  { id: '11', name: 'Gaming', slug: 'gaming', description: 'Video games and gaming industry', parentId: '10', feedCount: 67 },
  { id: '12', name: 'Sports', slug: 'sports', description: 'Sports news and analysis', feedCount: 89 },
  { id: '13', name: 'Health', slug: 'health', description: 'Health, wellness, and medicine', feedCount: 76 },
  { id: '14', name: 'Design', slug: 'design', description: 'UI/UX, graphic design, and creativity', feedCount: 54 },
  { id: '15', name: 'Podcasts', slug: 'podcasts', description: 'Podcast feeds and audio content', feedCount: 123 },
];

// Mock Tags
export const mockTags: Tag[] = [
  { id: '1', name: 'javascript', slug: 'javascript', usageCount: 89 },
  { id: '2', name: 'python', slug: 'python', usageCount: 76 },
  { id: '3', name: 'react', slug: 'react', usageCount: 54 },
  { id: '4', name: 'ai', slug: 'ai', usageCount: 67 },
  { id: '5', name: 'startup', slug: 'startup', usageCount: 45 },
  { id: '6', name: 'tutorial', slug: 'tutorial', usageCount: 123 },
  { id: '7', name: 'news', slug: 'news', usageCount: 234 },
  { id: '8', name: 'opinion', slug: 'opinion', usageCount: 56 },
  { id: '9', name: 'open-source', slug: 'open-source', usageCount: 78 },
  { id: '10', name: 'security', slug: 'security', usageCount: 43 },
  { id: '11', name: 'devops', slug: 'devops', usageCount: 38 },
  { id: '12', name: 'cloud', slug: 'cloud', usageCount: 52 },
];

// Mock Feeds
export const mockFeeds: Feed[] = [
  {
    id: '1',
    url: 'https://hnrss.org/frontpage',
    title: 'Hacker News',
    titleSource: 'llm',
    description: 'Links for the intellectually curious, curated by the Y Combinator community. Features tech news, startups, and programming discussions.',
    descriptionSource: 'llm',
    siteUrl: 'https://news.ycombinator.com',
    language: 'en',
    contentType: 'news',
    postingFrequency: 'hourly',
    postsPerWeek: 350,
    lastPostAt: '2024-12-13T14:30:00Z',
    lastFetchedAt: '2024-12-13T15:00:00Z',
    lastAnalyzedAt: '2024-12-13T12:00:00Z',
    status: 'active',
    submittedBy: mockUsers[1],
    approvedBy: mockUsers[0],
    approvedAt: '2024-02-20T00:00:00Z',
    categories: [mockCategories[0], mockCategories[1]],
    tags: [mockTags[0], mockTags[4], mockTags[8]],
    createdAt: '2024-02-18T00:00:00Z',
    updatedAt: '2024-12-13T15:00:00Z',
    upvotes: 245,
    downvotes: 12,
    score: 233,
    commentCount: 34,
    isFavorited: true,
    userVote: 1,
  },
  {
    id: '2',
    url: 'https://css-tricks.com/feed/',
    title: 'CSS-Tricks',
    titleSource: 'llm',
    description: 'Daily articles about CSS, HTML, JavaScript, and all things related to web design and development.',
    descriptionSource: 'user',
    siteUrl: 'https://css-tricks.com',
    language: 'en',
    contentType: 'blog',
    postingFrequency: 'daily',
    postsPerWeek: 7,
    lastPostAt: '2024-12-12T10:00:00Z',
    lastFetchedAt: '2024-12-13T14:00:00Z',
    lastAnalyzedAt: '2024-12-12T12:00:00Z',
    status: 'active',
    submittedBy: mockUsers[2],
    approvedBy: mockUsers[0],
    approvedAt: '2024-03-25T00:00:00Z',
    categories: [mockCategories[2], mockCategories[13]],
    tags: [mockTags[2], mockTags[5]],
    createdAt: '2024-03-22T00:00:00Z',
    updatedAt: '2024-12-13T14:00:00Z',
    upvotes: 189,
    downvotes: 8,
    score: 181,
    commentCount: 23,
    isFavorited: false,
    userVote: null,
  },
  {
    id: '3',
    url: 'https://feeds.feedburner.com/TechCrunch/',
    title: 'TechCrunch',
    titleSource: 'llm',
    description: 'TechCrunch is a leading technology media property, dedicated to obsessively profiling startups, reviewing new Internet products, and breaking tech news.',
    descriptionSource: 'llm',
    siteUrl: 'https://techcrunch.com',
    language: 'en',
    contentType: 'news',
    postingFrequency: 'hourly',
    postsPerWeek: 200,
    lastPostAt: '2024-12-13T15:30:00Z',
    lastFetchedAt: '2024-12-13T16:00:00Z',
    lastAnalyzedAt: '2024-12-13T12:00:00Z',
    status: 'active',
    submittedBy: mockUsers[3],
    approvedBy: mockUsers[0],
    approvedAt: '2024-04-15T00:00:00Z',
    categories: [mockCategories[0], mockCategories[7]],
    tags: [mockTags[4], mockTags[6]],
    createdAt: '2024-04-12T00:00:00Z',
    updatedAt: '2024-12-13T16:00:00Z',
    upvotes: 312,
    downvotes: 45,
    score: 267,
    commentCount: 56,
    isFavorited: true,
    userVote: 1,
  },
  {
    id: '4',
    url: 'https://blog.openai.com/rss/',
    title: 'OpenAI Blog',
    titleSource: 'llm',
    description: 'Research and announcements from OpenAI, covering artificial intelligence, machine learning, and AI safety.',
    descriptionSource: 'llm',
    siteUrl: 'https://openai.com/blog',
    language: 'en',
    contentType: 'blog',
    postingFrequency: 'weekly',
    postsPerWeek: 2,
    lastPostAt: '2024-12-10T18:00:00Z',
    lastFetchedAt: '2024-12-13T12:00:00Z',
    lastAnalyzedAt: '2024-12-11T12:00:00Z',
    status: 'active',
    submittedBy: mockUsers[3],
    approvedBy: mockUsers[0],
    approvedAt: '2024-04-20T00:00:00Z',
    categories: [mockCategories[3], mockCategories[6]],
    tags: [mockTags[3], mockTags[1]],
    createdAt: '2024-04-18T00:00:00Z',
    updatedAt: '2024-12-13T12:00:00Z',
    upvotes: 456,
    downvotes: 23,
    score: 433,
    commentCount: 78,
    isFavorited: true,
    userVote: 1,
  },
  {
    id: '5',
    url: 'https://www.theverge.com/rss/index.xml',
    title: 'The Verge',
    titleSource: 'llm',
    description: 'The Verge covers the intersection of technology, science, art, and culture.',
    descriptionSource: 'llm',
    siteUrl: 'https://www.theverge.com',
    language: 'en',
    contentType: 'news',
    postingFrequency: 'hourly',
    postsPerWeek: 280,
    lastPostAt: '2024-12-13T16:00:00Z',
    lastFetchedAt: '2024-12-13T16:30:00Z',
    lastAnalyzedAt: '2024-12-13T12:00:00Z',
    status: 'active',
    submittedBy: mockUsers[1],
    approvedBy: mockUsers[0],
    approvedAt: '2024-02-25T00:00:00Z',
    categories: [mockCategories[0], mockCategories[9]],
    tags: [mockTags[6], mockTags[3]],
    createdAt: '2024-02-22T00:00:00Z',
    updatedAt: '2024-12-13T16:30:00Z',
    upvotes: 278,
    downvotes: 34,
    score: 244,
    commentCount: 45,
    isFavorited: false,
    userVote: -1,
  },
  {
    id: '6',
    url: 'https://overreacted.io/rss.xml',
    title: 'Overreacted',
    titleSource: 'llm',
    description: 'Personal blog by Dan Abramov, co-author of Redux and Create React App. Deep dives into React and JavaScript.',
    descriptionSource: 'user',
    siteUrl: 'https://overreacted.io',
    language: 'en',
    contentType: 'blog',
    postingFrequency: 'monthly',
    postsPerWeek: 0.5,
    lastPostAt: '2024-11-15T10:00:00Z',
    lastFetchedAt: '2024-12-13T12:00:00Z',
    lastAnalyzedAt: '2024-11-16T12:00:00Z',
    status: 'active',
    submittedBy: mockUsers[2],
    approvedBy: mockUsers[0],
    approvedAt: '2024-03-30T00:00:00Z',
    categories: [mockCategories[1], mockCategories[2]],
    tags: [mockTags[2], mockTags[0], mockTags[5]],
    createdAt: '2024-03-28T00:00:00Z',
    updatedAt: '2024-12-13T12:00:00Z',
    upvotes: 567,
    downvotes: 12,
    score: 555,
    commentCount: 89,
    isFavorited: true,
    userVote: 1,
  },
  {
    id: '7',
    url: 'https://www.wired.com/feed/rss',
    title: 'WIRED',
    titleSource: 'llm',
    description: 'WIRED is where tomorrow is realized. It is the essential source of information and ideas that make sense of a world in constant transformation.',
    descriptionSource: 'llm',
    siteUrl: 'https://www.wired.com',
    language: 'en',
    contentType: 'news',
    postingFrequency: 'hourly',
    postsPerWeek: 150,
    lastPostAt: '2024-12-13T14:00:00Z',
    lastFetchedAt: '2024-12-13T15:00:00Z',
    lastAnalyzedAt: '2024-12-13T12:00:00Z',
    status: 'active',
    submittedBy: mockUsers[4],
    approvedBy: mockUsers[0],
    approvedAt: '2024-05-10T00:00:00Z',
    categories: [mockCategories[0], mockCategories[6]],
    tags: [mockTags[6], mockTags[3]],
    createdAt: '2024-05-08T00:00:00Z',
    updatedAt: '2024-12-13T15:00:00Z',
    upvotes: 234,
    downvotes: 28,
    score: 206,
    commentCount: 34,
    isFavorited: false,
    userVote: null,
  },
  {
    id: '8',
    url: 'https://feeds.simplecast.com/54nAGcIl',
    title: 'Syntax - Tasty Web Development Treats',
    titleSource: 'llm',
    description: 'Full Stack Developers Wes Bos and Scott Tolinski dive deep into web development topics, explaining how they work and talking about their own experiences.',
    descriptionSource: 'llm',
    siteUrl: 'https://syntax.fm',
    language: 'en',
    contentType: 'podcast',
    postingFrequency: 'weekly',
    postsPerWeek: 3,
    lastPostAt: '2024-12-11T12:00:00Z',
    lastFetchedAt: '2024-12-13T12:00:00Z',
    lastAnalyzedAt: '2024-12-12T12:00:00Z',
    status: 'active',
    submittedBy: mockUsers[4],
    approvedBy: mockUsers[0],
    approvedAt: '2024-05-15T00:00:00Z',
    categories: [mockCategories[14], mockCategories[2]],
    tags: [mockTags[0], mockTags[2], mockTags[5]],
    createdAt: '2024-05-12T00:00:00Z',
    updatedAt: '2024-12-13T12:00:00Z',
    upvotes: 345,
    downvotes: 15,
    score: 330,
    commentCount: 56,
    isFavorited: true,
    userVote: 1,
  },
  {
    id: '9',
    url: 'https://martinfowler.com/feed.atom',
    title: 'Martin Fowler',
    titleSource: 'llm',
    description: 'Thoughts on software development, architecture, and agile methodologies from Martin Fowler.',
    descriptionSource: 'llm',
    siteUrl: 'https://martinfowler.com',
    language: 'en',
    contentType: 'blog',
    postingFrequency: 'monthly',
    postsPerWeek: 1,
    lastPostAt: '2024-12-05T10:00:00Z',
    lastFetchedAt: '2024-12-13T12:00:00Z',
    lastAnalyzedAt: '2024-12-06T12:00:00Z',
    status: 'active',
    submittedBy: mockUsers[1],
    approvedBy: mockUsers[0],
    approvedAt: '2024-02-28T00:00:00Z',
    categories: [mockCategories[1]],
    tags: [mockTags[5], mockTags[8]],
    createdAt: '2024-02-25T00:00:00Z',
    updatedAt: '2024-12-13T12:00:00Z',
    upvotes: 423,
    downvotes: 8,
    score: 415,
    commentCount: 67,
    isFavorited: false,
    userVote: null,
  },
  {
    id: '10',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    title: 'Ars Technica',
    titleSource: 'llm',
    description: 'Serving the Technologist for more than a decade. IT news, reviews, and analysis.',
    descriptionSource: 'llm',
    siteUrl: 'https://arstechnica.com',
    language: 'en',
    contentType: 'news',
    postingFrequency: 'hourly',
    postsPerWeek: 180,
    lastPostAt: '2024-12-13T15:00:00Z',
    lastFetchedAt: '2024-12-13T16:00:00Z',
    lastAnalyzedAt: '2024-12-13T12:00:00Z',
    status: 'active',
    submittedBy: mockUsers[2],
    approvedBy: mockUsers[0],
    approvedAt: '2024-03-28T00:00:00Z',
    categories: [mockCategories[0], mockCategories[6]],
    tags: [mockTags[6], mockTags[9]],
    createdAt: '2024-03-25T00:00:00Z',
    updatedAt: '2024-12-13T16:00:00Z',
    upvotes: 289,
    downvotes: 21,
    score: 268,
    commentCount: 45,
    isFavorited: false,
    userVote: 1,
  },
  // Pending feeds
  {
    id: '11',
    url: 'https://example.com/new-tech-blog/feed',
    title: 'New Tech Blog',
    titleSource: 'llm',
    description: 'A new technology blog covering emerging trends.',
    descriptionSource: 'llm',
    siteUrl: 'https://example.com/new-tech-blog',
    language: 'en',
    contentType: 'blog',
    postingFrequency: 'weekly',
    postsPerWeek: 3,
    status: 'pending',
    submittedBy: mockUsers[4],
    categories: [mockCategories[0]],
    tags: [mockTags[6]],
    createdAt: '2024-12-12T00:00:00Z',
    updatedAt: '2024-12-12T00:00:00Z',
    upvotes: 0,
    downvotes: 0,
    score: 0,
    commentCount: 0,
  },
  {
    id: '12',
    url: 'https://example.com/ai-weekly/feed',
    title: 'AI Weekly Digest',
    titleSource: 'llm',
    description: 'Weekly roundup of AI and machine learning news.',
    descriptionSource: 'llm',
    siteUrl: 'https://example.com/ai-weekly',
    language: 'en',
    contentType: 'newsletter',
    postingFrequency: 'weekly',
    postsPerWeek: 1,
    status: 'pending',
    submittedBy: mockUsers[3],
    categories: [mockCategories[3]],
    tags: [mockTags[3]],
    createdAt: '2024-12-11T00:00:00Z',
    updatedAt: '2024-12-11T00:00:00Z',
    upvotes: 0,
    downvotes: 0,
    score: 0,
    commentCount: 0,
  },
];

// Mock Feed Posts
export const mockFeedPosts: FeedPost[] = [
  {
    id: '1',
    feedId: '1',
    guid: 'hn-12345',
    title: 'Show HN: I built an open-source alternative to Notion',
    link: 'https://news.ycombinator.com/item?id=12345',
    content: 'After months of work, I\'m excited to share my open-source note-taking app...',
    publishedAt: '2024-12-13T14:30:00Z',
    fetchedAt: '2024-12-13T15:00:00Z',
  },
  {
    id: '2',
    feedId: '1',
    guid: 'hn-12346',
    title: 'The Future of WebAssembly',
    link: 'https://news.ycombinator.com/item?id=12346',
    content: 'WebAssembly is evolving rapidly with new proposals for garbage collection...',
    publishedAt: '2024-12-13T13:00:00Z',
    fetchedAt: '2024-12-13T15:00:00Z',
  },
  {
    id: '3',
    feedId: '2',
    guid: 'css-tricks-789',
    title: 'A Complete Guide to CSS Grid',
    link: 'https://css-tricks.com/snippets/css/complete-guide-grid/',
    content: 'CSS Grid Layout is the most powerful layout system available in CSS...',
    publishedAt: '2024-12-12T10:00:00Z',
    fetchedAt: '2024-12-13T14:00:00Z',
  },
];

// Mock Comments
export const mockComments: Comment[] = [
  {
    id: '1',
    feedId: '1',
    user: mockUsers[2],
    content: 'This is one of my favorite feeds! Always has great content.',
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
    replies: [
      {
        id: '2',
        feedId: '1',
        user: mockUsers[1],
        content: 'Agreed! The community curation really makes it stand out.',
        parentId: '1',
        createdAt: '2024-12-10T11:00:00Z',
        updatedAt: '2024-12-10T11:00:00Z',
      },
    ],
  },
  {
    id: '3',
    feedId: '1',
    user: mockUsers[3],
    content: 'Would be nice if they had better filtering options.',
    createdAt: '2024-12-11T14:00:00Z',
    updatedAt: '2024-12-11T14:00:00Z',
  },
  {
    id: '4',
    feedId: '4',
    user: mockUsers[1],
    content: 'OpenAI\'s research posts are always incredibly detailed and well-written.',
    createdAt: '2024-12-08T09:00:00Z',
    updatedAt: '2024-12-08T09:00:00Z',
  },
  {
    id: '5',
    feedId: '6',
    user: mockUsers[4],
    content: 'Dan\'s explanations of React concepts are unmatched. Every post is a gem.',
    createdAt: '2024-11-20T16:00:00Z',
    updatedAt: '2024-11-20T16:00:00Z',
  },
];

// Mock Proposals
export const mockProposals: Proposal[] = [
  {
    id: '1',
    feedId: '1',
    feed: mockFeeds[0],
    user: mockUsers[2],
    type: 'edit',
    title: 'Update Hacker News description',
    description: 'The current description doesn\'t mention that HN is run by Y Combinator. I propose updating it to be more accurate.',
    changes: {
      description: 'Hacker News is a social news website focusing on computer science and entrepreneurship, run by Y Combinator.',
    },
    status: 'open',
    votesFor: 12,
    votesAgainst: 3,
    createdAt: '2024-12-10T00:00:00Z',
    updatedAt: '2024-12-12T00:00:00Z',
  },
  {
    id: '2',
    user: mockUsers[1],
    type: 'feature',
    title: 'Add RSS feed export functionality',
    description: 'It would be great if users could export their favorite feeds as an OPML file for use in other RSS readers.',
    status: 'approved',
    votesFor: 45,
    votesAgainst: 5,
    reviewedBy: mockUsers[0],
    reviewedAt: '2024-12-08T00:00:00Z',
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-08T00:00:00Z',
  },
  {
    id: '3',
    feedId: '5',
    feed: mockFeeds[4],
    user: mockUsers[3],
    type: 'edit',
    title: 'Add missing categories to The Verge',
    description: 'The Verge covers gaming extensively but doesn\'t have the Gaming category assigned.',
    changes: {
      categories: ['technology', 'entertainment', 'gaming'],
    },
    status: 'implemented',
    votesFor: 23,
    votesAgainst: 2,
    reviewedBy: mockUsers[0],
    reviewedAt: '2024-12-05T00:00:00Z',
    createdAt: '2024-12-02T00:00:00Z',
    updatedAt: '2024-12-05T00:00:00Z',
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '3',
    type: 'feed_approved',
    title: 'Your feed submission was approved!',
    message: 'CSS-Tricks has been approved and is now live on FeedPulse.',
    referenceType: 'feed',
    referenceId: '2',
    read: false,
    createdAt: '2024-12-13T10:00:00Z',
  },
  {
    id: '2',
    userId: '3',
    type: 'points_earned',
    title: 'You earned 10 points!',
    message: 'Points awarded for your approved feed submission.',
    read: false,
    createdAt: '2024-12-13T10:00:00Z',
  },
  {
    id: '3',
    userId: '3',
    type: 'comment_reply',
    title: 'Jane Smith replied to your comment',
    message: 'Agreed! The community curation really makes it stand out.',
    referenceType: 'comment',
    referenceId: '2',
    read: true,
    createdAt: '2024-12-10T11:00:00Z',
  },
];

// Mock Leaderboard
export const mockLeaderboard: LeaderboardEntry[] = mockUsers
  .filter(u => u.role !== 'admin')
  .sort((a, b) => b.points - a.points)
  .map((user, index) => ({
    user,
    rank: index + 1,
    feedsSubmitted: Math.floor(Math.random() * 20) + 1,
    commentsCount: Math.floor(Math.random() * 50) + 5,
    proposalsCount: Math.floor(Math.random() * 10),
    proposalsApproved: Math.floor(Math.random() * 5),
    votesCast: Math.floor(Math.random() * 100) + 10,
  }));

// Helper function to generate daily stats for the past N days
function generateDailyStats(
  feedId: string,
  daysBack: number,
  avgPostsPerDay: number,
  variance: number = 0.5
): FeedDailyStats[] {
  const stats: FeedDailyStats[] = [];
  const today = new Date();
  
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add some randomness to post counts
    const randomFactor = 1 + (Math.random() - 0.5) * variance * 2;
    const postCount = Math.max(0, Math.round(avgPostsPerDay * randomFactor));
    
    // Some days might have no posts (especially for less frequent feeds)
    if (avgPostsPerDay < 1 && Math.random() > avgPostsPerDay) {
      continue;
    }
    
    stats.push({
      date: date.toISOString().split('T')[0],
      postCount,
    });
  }
  
  return stats.reverse();
}

// Mock Feed History Summaries
export const mockFeedHistories: Record<string, FeedHistorySummary> = {
  '1': { // Hacker News
    feedId: '1',
    firstPostAt: '2007-02-19T00:00:00Z',
    lastPostAt: '2024-12-13T14:30:00Z',
    totalPosts: 125000,
    activeDays: 6200,
    daysActive: 6500,
    avgPostsPerActiveDay: 20.16,
    avgPostsPerWeek: 350,
    postsLast7d: 2450,
    postsLast30d: 10500,
    postsLast90d: 31500,
    dailyStats: generateDailyStats('1', 90, 50, 0.3),
  },
  '2': { // CSS-Tricks
    feedId: '2',
    firstPostAt: '2007-09-01T00:00:00Z',
    lastPostAt: '2024-12-12T10:00:00Z',
    totalPosts: 4500,
    activeDays: 3200,
    daysActive: 6300,
    avgPostsPerActiveDay: 1.4,
    avgPostsPerWeek: 7,
    postsLast7d: 7,
    postsLast30d: 30,
    postsLast90d: 90,
    dailyStats: generateDailyStats('2', 90, 1, 0.5),
  },
  '3': { // TechCrunch
    feedId: '3',
    firstPostAt: '2005-06-11T00:00:00Z',
    lastPostAt: '2024-12-13T15:30:00Z',
    totalPosts: 180000,
    activeDays: 7100,
    daysActive: 7120,
    avgPostsPerActiveDay: 25.35,
    avgPostsPerWeek: 200,
    postsLast7d: 1400,
    postsLast30d: 6000,
    postsLast90d: 18000,
    dailyStats: generateDailyStats('3', 90, 28, 0.4),
  },
  '4': { // OpenAI Blog
    feedId: '4',
    firstPostAt: '2015-12-11T00:00:00Z',
    lastPostAt: '2024-12-10T18:00:00Z',
    totalPosts: 450,
    activeDays: 380,
    daysActive: 3290,
    avgPostsPerActiveDay: 1.18,
    avgPostsPerWeek: 2,
    postsLast7d: 1,
    postsLast30d: 8,
    postsLast90d: 24,
    dailyStats: generateDailyStats('4', 90, 0.3, 0.8),
  },
  '5': { // The Verge
    feedId: '5',
    firstPostAt: '2011-11-01T00:00:00Z',
    lastPostAt: '2024-12-13T16:00:00Z',
    totalPosts: 95000,
    activeDays: 4780,
    daysActive: 4790,
    avgPostsPerActiveDay: 19.87,
    avgPostsPerWeek: 280,
    postsLast7d: 1960,
    postsLast30d: 8400,
    postsLast90d: 25200,
    dailyStats: generateDailyStats('5', 90, 40, 0.35),
  },
  '6': { // Overreacted
    feedId: '6',
    firstPostAt: '2018-10-21T00:00:00Z',
    lastPostAt: '2024-11-15T10:00:00Z',
    totalPosts: 35,
    activeDays: 35,
    daysActive: 2245,
    avgPostsPerActiveDay: 1,
    avgPostsPerWeek: 0.5,
    postsLast7d: 0,
    postsLast30d: 1,
    postsLast90d: 2,
    dailyStats: generateDailyStats('6', 90, 0.07, 1),
  },
  '7': { // WIRED
    feedId: '7',
    firstPostAt: '1993-01-01T00:00:00Z',
    lastPostAt: '2024-12-13T14:00:00Z',
    totalPosts: 120000,
    activeDays: 8500,
    daysActive: 11680,
    avgPostsPerActiveDay: 14.12,
    avgPostsPerWeek: 150,
    postsLast7d: 1050,
    postsLast30d: 4500,
    postsLast90d: 13500,
    dailyStats: generateDailyStats('7', 90, 21, 0.4),
  },
  '8': { // Syntax Podcast
    feedId: '8',
    firstPostAt: '2017-07-19T00:00:00Z',
    lastPostAt: '2024-12-11T12:00:00Z',
    totalPosts: 850,
    activeDays: 850,
    daysActive: 2704,
    avgPostsPerActiveDay: 1,
    avgPostsPerWeek: 3,
    postsLast7d: 3,
    postsLast30d: 12,
    postsLast90d: 36,
    dailyStats: generateDailyStats('8', 90, 0.43, 0.6),
  },
  '9': { // Martin Fowler
    feedId: '9',
    firstPostAt: '2003-01-01T00:00:00Z',
    lastPostAt: '2024-12-05T10:00:00Z',
    totalPosts: 280,
    activeDays: 280,
    daysActive: 8012,
    avgPostsPerActiveDay: 1,
    avgPostsPerWeek: 1,
    postsLast7d: 1,
    postsLast30d: 4,
    postsLast90d: 12,
    dailyStats: generateDailyStats('9', 90, 0.14, 0.9),
  },
  '10': { // Ars Technica
    feedId: '10',
    firstPostAt: '1998-12-30T00:00:00Z',
    lastPostAt: '2024-12-13T15:00:00Z',
    totalPosts: 145000,
    activeDays: 9500,
    daysActive: 9480,
    avgPostsPerActiveDay: 15.26,
    avgPostsPerWeek: 180,
    postsLast7d: 1260,
    postsLast30d: 5400,
    postsLast90d: 16200,
    dailyStats: generateDailyStats('10', 90, 26, 0.35),
  },
};

// Current user (for demo purposes - logged in as John Doe)
export const currentUser: User | null = mockUsers[2];

// Helper functions
export function getFeedById(id: string): Feed | undefined {
  return mockFeeds.find(f => f.id === id);
}

export function getFeedsByCategory(categorySlug: string): Feed[] {
  return mockFeeds.filter(f => 
    f.status === 'active' && 
    f.categories.some(c => c.slug === categorySlug)
  );
}

export function getFeedsByTag(tagSlug: string): Feed[] {
  return mockFeeds.filter(f => 
    f.status === 'active' && 
    f.tags.some(t => t.slug === tagSlug)
  );
}

export function getActiveFeeds(): Feed[] {
  return mockFeeds.filter(f => f.status === 'active');
}

export function getPendingFeeds(): Feed[] {
  return mockFeeds.filter(f => f.status === 'pending');
}

export function getCommentsByFeedId(feedId: string): Comment[] {
  return mockComments.filter(c => c.feedId === feedId && !c.parentId);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return mockCategories.find(c => c.slug === slug);
}

export function getTagBySlug(slug: string): Tag | undefined {
  return mockTags.find(t => t.slug === slug);
}

export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}

export function searchFeeds(query: string): Feed[] {
  const lowerQuery = query.toLowerCase();
  return mockFeeds.filter(f => 
    f.status === 'active' && (
      f.title.toLowerCase().includes(lowerQuery) ||
      f.description?.toLowerCase().includes(lowerQuery) ||
      f.categories.some(c => c.name.toLowerCase().includes(lowerQuery)) ||
      f.tags.some(t => t.name.toLowerCase().includes(lowerQuery))
    )
  );
}

export function getFeedHistory(feedId: string): FeedHistorySummary | undefined {
  return mockFeedHistories[feedId];
}
