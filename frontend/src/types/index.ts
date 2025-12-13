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
