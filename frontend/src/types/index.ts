// User types
export type UserRole = 'guest' | 'user' | 'contributor' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  points: number;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  feedCount?: number;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
}

// Feed types
export type FeedStatus = 'pending' | 'active' | 'inactive' | 'rejected';
export type DataSource = 'llm' | 'user' | 'admin';

export interface Feed {
  id: string;
  url: string;
  title: string;
  titleSource: DataSource;
  description?: string;
  descriptionSource: DataSource;
  siteUrl?: string;
  imageUrl?: string;
  language?: string;
  contentType?: string;
  postingFrequency?: string;
  postsPerWeek?: number;
  lastPostAt?: string;
  lastFetchedAt?: string;
  lastAnalyzedAt?: string;
  useReadability?: boolean;
  status: FeedStatus;
  rejectionReason?: string;
  submittedBy?: User;
  approvedBy?: User;
  approvedAt?: string;
  categories: Category[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  // Computed fields
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  isFavorited?: boolean;
  userVote?: 1 | -1 | null;
}

// Feed Post types
export interface FeedPost {
  id: string;
  feedId: string;
  guid: string;
  title?: string;
  link?: string;
  content?: string;
  fullContent?: string;
  publishedAt?: string;
  fetchedAt: string;
}

// Feed Fetch Log types
export interface FeedFetchLog {
  id: string;
  feedId: string;
  feed?: { id: string; title?: string; url: string };
  success: boolean;
  statusCode?: number;
  errorType?: string;
  errorMessage?: string;
  responseTimeMs?: number;
  postsFound?: number;
  newPosts?: number;
  fetchedAt: string;
}

// Queue Item types
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueueItem {
  id: string;
  feedId: string;
  feed?: { id: string; title?: string; url: string };
  priority: number;
  status: QueueStatus;
  triggeredBy?: string;
  triggerer?: { id: string; displayName: string };
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  completedLast24h: number;
  failedLast24h: number;
  avgProcessingTimeMs: number;
}

// Comment types
export interface Comment {
  id: string;
  feedId: string;
  user: User;
  content: string;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Vote types
export interface Vote {
  id: string;
  feedId: string;
  userId: string;
  value: 1 | -1;
  createdAt: string;
}

// Proposal types
export type ProposalType = 'edit' | 'feature' | 'removal';
export type ProposalStatus = 'open' | 'approved' | 'rejected' | 'implemented';

export interface Proposal {
  id: string;
  feedId?: string;
  feed?: Feed;
  user: User;
  type: ProposalType;
  title: string;
  description: string;
  changes?: Record<string, unknown>;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  reviewedBy?: User;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export type NotificationType = 
  | 'proposal_approved' 
  | 'proposal_rejected' 
  | 'comment_reply' 
  | 'feed_approved' 
  | 'points_earned';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  referenceType?: string;
  referenceId?: string;
  read: boolean;
  createdAt: string;
}

// Point Transaction types
export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

// Leaderboard entry
export interface LeaderboardEntry {
  user: User;
  rank: number;
  feedsSubmitted: number;
  commentsCount: number;
  proposalsCount: number;
  proposalsApproved: number;
  votesCast: number;
}

// Feed Statistics (periodic snapshots)
export interface FeedStatistics {
  id: string;
  feedId: string;
  periodStart: string;
  periodEnd: string;
  postCount: number;
  avgPostLength?: number;
  contentTypes?: Record<string, number>;
}

// Daily post count for charts
export interface FeedDailyStats {
  date: string;
  postCount: number;
}

// Comprehensive feed history summary
export interface FeedHistorySummary {
  feedId: string;
  firstPostAt?: string;
  lastPostAt?: string;
  totalPosts: number;
  activeDays: number;
  daysActive: number;
  avgPostsPerActiveDay: number;
  avgPostsPerWeek: number;
  postsLast7d: number;
  postsLast30d: number;
  postsLast90d: number;
  dailyStats: FeedDailyStats[];
}

// Search/Filter types
export interface FeedFilters {
  query?: string;
  categoryId?: string;
  tagId?: string;
  status?: FeedStatus;
  contentType?: string;
  postingFrequency?: string;
  sortBy?: 'score' | 'recent' | 'posts' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Feed Analytics types
export interface FeedFeatureStats {
  enabled: boolean;
  count?: number;
  postsWithAuthor?: number;
  postsWithCategories?: number;
  postsWithMedia?: number;
  postsWithThumbnail?: number;
  postsWithEnclosure?: number;
  postsWithDuration?: number;
  postsWithFullContent?: number;
  postsWithComments?: number;
  percentage: number;
  avgDurationSeconds?: number | null;
  totalDurationSeconds?: number | null;
}

export interface FeedAnalytics {
  feedId: string;
  feedTitle?: string;
  feedUrl: string;
  
  summary: {
    totalPosts: number;
    uniqueAuthors: number;
    uniqueCategories: number;
    dateRange: {
      oldest: string | null;
      newest: string | null;
    };
  };
  
  features: {
    authors: FeedFeatureStats;
    categories: FeedFeatureStats;
    media: FeedFeatureStats;
    thumbnails: FeedFeatureStats;
    enclosures: FeedFeatureStats;
    durations: FeedFeatureStats;
    fullContent: FeedFeatureStats;
    comments: FeedFeatureStats;
  };
  
  content: {
    postsWithContent: number;
    avgContentLength: number | null;
    avgTitleLength: number | null;
  };
  
  topAuthors: { name: string; count: number }[];
  topCategories: { name: string; count: number }[];
  mediaTypes: { type: string; count: number }[];
  
  isPodcast: boolean;
  analyzedAt: string;
}
