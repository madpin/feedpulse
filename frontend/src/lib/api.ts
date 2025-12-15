import type {
  User,
  Feed,
  FeedPost,
  FeedFetchLog,
  Category,
  Tag,
  Comment,
  Proposal,
  Notification,
  LeaderboardEntry,
  FeedHistorySummary,
  FeedAnalytics,
  PaginatedResponse,
  ApiResponse,
  FeedFilters,
  QueueItem,
  QueueStats,
} from '@/types';

// Safe API URL getter that works in SSR and the browser without assuming localhost
const getApiUrl = (): string => {
  // Highest priority: explicit public env var (works in Vercel/Netlify/etc)
  const envUrl =
    (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_API_URL || process.env?.API_URL)) ||
    null;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // Next/Vercel exposes VERCEL_URL without protocol on server
  if (typeof process !== 'undefined' && process.env?.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.startsWith('http')
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
    return vercelUrl.replace(/\/$/, '');
  }

  // Browser fallback: same origin as the loaded site
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }

  // Local dev fallback
  return 'http://localhost:3838';
};

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }
}

export function getTokens() {
  if (typeof window !== 'undefined' && !accessToken) {
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
    console.log('[Auth] Loaded tokens from localStorage:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });
  }
  return { accessToken, refreshToken };
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// API client
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { accessToken } = getTokens();
  
  const headers: HeadersInit = {
    ...options.headers,
  };
  
  // Only set Content-Type if there's a body with actual content
  if (options.body && options.body !== '{}') {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  
  // Don't send empty body - create clean options object
  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
  };
  
  // Only include body if it has actual content
  if (options.body && options.body !== '{}') {
    fetchOptions.body = options.body;
  }
  
  console.log(`[API] ${options.method || 'GET'} ${endpoint}`, { hasToken: !!accessToken });
  
  const response = await fetch(`${getApiUrl()}${endpoint}`, fetchOptions);
  
  // Handle token refresh
  if (response.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry with new token
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
      const retryResponse = await fetch(`${getApiUrl()}${endpoint}`, {
        ...fetchOptions,
        headers,
      });
      return retryResponse.json();
    }
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const { refreshToken: token } = getTokens();
    if (!token) return false;
    
    const response = await fetch(`${getApiUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });
    
    if (!response.ok) {
      clearTokens();
      return false;
    }
    
    const data = await response.json();
    accessToken = data.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
    }
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ============================================
// AUTH API
// ============================================
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const data = await fetchApi<{ user: User; accessToken: string; refreshToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },
  
  async register(email: string, password: string, displayName: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const data = await fetchApi<{ user: User; accessToken: string; refreshToken: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },
  
  async logout(): Promise<void> {
    try {
      await fetchApi('/api/auth/logout', { method: 'POST' });
    } finally {
      clearTokens();
    }
  },
  
  async getMe(): Promise<User> {
    return fetchApi<User>('/api/auth/me');
  },
};

// ============================================
// FEEDS API
// ============================================
export const feedsApi = {
  async getFeeds(filters?: FeedFilters & { page?: number; pageSize?: number }): Promise<PaginatedResponse<Feed>> {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
    if (filters?.status) params.set('status', filters.status);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.tagId) params.set('tagId', filters.tagId);
    if (filters?.contentType) params.set('contentType', filters.contentType);
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);
    if (filters?.query) params.set('query', filters.query);
    
    return fetchApi<PaginatedResponse<Feed>>(`/api/feeds?${params}`);
  },
  
  async getFeed(id: string): Promise<Feed> {
    return fetchApi<Feed>(`/api/feeds/${id}`);
  },
  
  async submitFeed(data: { url: string; title?: string; description?: string; categoryIds?: string[]; tagIds?: string[] }): Promise<Feed> {
    return fetchApi<Feed>('/api/feeds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async toggleFavorite(feedId: string): Promise<{ isFavorited: boolean }> {
    return fetchApi<{ isFavorited: boolean }>(`/api/feeds/${feedId}/favorite`, {
      method: 'POST',
    });
  },
  
  async getFeedHistory(feedId: string): Promise<FeedHistorySummary> {
    return fetchApi<FeedHistorySummary>(`/api/feeds/${feedId}/history`);
  },
  
  async getFeedPosts(feedId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<FeedPost>> {
    return fetchApi<PaginatedResponse<FeedPost>>(`/api/feeds/${feedId}/posts?page=${page}&pageSize=${pageSize}`);
  },
  
  async getFeedAnalytics(feedId: string, refresh = false): Promise<FeedAnalytics> {
    const params = new URLSearchParams();
    if (refresh) params.set('refresh', 'true');
    return fetchApi<FeedAnalytics>(`/api/feeds/${feedId}/analytics?${params}`);
  },
};

// ============================================
// VOTES API
// ============================================
export const votesApi = {
  async vote(feedId: string, value: 1 | -1): Promise<{ userVote: 1 | -1 | null }> {
    return fetchApi<{ userVote: 1 | -1 | null }>('/api/votes', {
      method: 'POST',
      body: JSON.stringify({ feedId, value }),
    });
  },
  
  async getVoteCounts(feedId: string): Promise<{ upvotes: number; downvotes: number; score: number }> {
    return fetchApi(`/api/votes/feed/${feedId}`);
  },
};

// ============================================
// COMMENTS API
// ============================================
export const commentsApi = {
  async getComments(feedId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Comment>> {
    return fetchApi<PaginatedResponse<Comment>>(`/api/comments/feed/${feedId}?page=${page}&pageSize=${pageSize}`);
  },
  
  async createComment(feedId: string, content: string, parentId?: string): Promise<Comment> {
    return fetchApi<Comment>('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ feedId, content, parentId }),
    });
  },
  
  async updateComment(id: string, content: string): Promise<Comment> {
    return fetchApi<Comment>(`/api/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },
  
  async deleteComment(id: string): Promise<void> {
    await fetchApi(`/api/comments/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// CATEGORIES API
// ============================================
export const categoriesApi = {
  async getCategories(): Promise<Category[]> {
    return fetchApi<Category[]>('/api/categories');
  },
  
  async getRootCategories(): Promise<Category[]> {
    return fetchApi<Category[]>('/api/categories/root');
  },
  
  async getCategory(slug: string): Promise<Category & { children: Category[] }> {
    return fetchApi(`/api/categories/${slug}`);
  },
};

// ============================================
// TAGS API
// ============================================
export const tagsApi = {
  async getTags(query?: string, limit = 50): Promise<Tag[]> {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    params.set('limit', limit.toString());
    return fetchApi<Tag[]>(`/api/tags?${params}`);
  },
  
  async getPopularTags(limit = 20): Promise<Tag[]> {
    return fetchApi<Tag[]>(`/api/tags/popular?limit=${limit}`);
  },
  
  async getTag(slug: string): Promise<Tag> {
    return fetchApi<Tag>(`/api/tags/${slug}`);
  },
};

// ============================================
// USERS API
// ============================================
export const usersApi = {
  async getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    return fetchApi<LeaderboardEntry[]>(`/api/users/leaderboard?limit=${limit}`);
  },
  
  async getUser(id: string): Promise<User & { stats: Record<string, number>; rank: number }> {
    return fetchApi(`/api/users/${id}`);
  },
  
  async updateProfile(data: { displayName?: string; bio?: string; avatarUrl?: string }): Promise<User> {
    return fetchApi<User>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  async getUserFeeds(userId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Feed>> {
    return fetchApi<PaginatedResponse<Feed>>(`/api/users/${userId}/feeds?page=${page}&pageSize=${pageSize}`);
  },
  
  async getFavorites(page = 1, pageSize = 20): Promise<PaginatedResponse<Feed>> {
    return fetchApi<PaginatedResponse<Feed>>(`/api/users/me/favorites?page=${page}&pageSize=${pageSize}`);
  },
};

// ============================================
// PROPOSALS API
// ============================================
export const proposalsApi = {
  async getProposals(filters?: { status?: string; type?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Proposal>> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
    return fetchApi<PaginatedResponse<Proposal>>(`/api/proposals?${params}`);
  },
  
  async getProposal(id: string): Promise<Proposal> {
    return fetchApi<Proposal>(`/api/proposals/${id}`);
  },
  
  async createProposal(data: { feedId?: string; type: string; title: string; description: string; changes?: Record<string, unknown> }): Promise<Proposal> {
    return fetchApi<Proposal>('/api/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async voteProposal(id: string, value: 1 | -1): Promise<{ userVote: 1 | -1 | null }> {
    return fetchApi<{ userVote: 1 | -1 | null }>(`/api/proposals/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  },
};

// ============================================
// SEARCH API
// ============================================
export const searchApi = {
  async search(query: string, options?: { limit?: number; semantic?: boolean }): Promise<Feed[]> {
    const params = new URLSearchParams();
    params.set('query', query);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.semantic) params.set('semantic', 'true');
    return fetchApi<Feed[]>(`/api/search?${params}`);
  },
  
  async getSimilarFeeds(feedId: string, limit = 10): Promise<Feed[]> {
    return fetchApi<Feed[]>(`/api/search/similar/${feedId}?limit=${limit}`);
  },
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsApi = {
  async getNotifications(): Promise<Notification[]> {
    return fetchApi<Notification[]>('/api/notifications');
  },
  
  async markAsRead(id: string): Promise<void> {
    await fetchApi(`/api/notifications/${id}/read`, { method: 'POST' });
  },
  
  async markAllAsRead(): Promise<void> {
    await fetchApi('/api/notifications/read-all', { method: 'POST' });
  },
};

// ============================================
// STATS API (Public)
// ============================================
export const statsApi = {
  async getStats(): Promise<{ feeds: number; users: number; categories: number }> {
    return fetchApi('/api/stats');
  },
};

// ============================================
// ADMIN API
// ============================================
export const adminApi = {
  async getStats(): Promise<{ feeds: Record<string, number>; users: Record<string, number>; queue: Record<string, number> }> {
    return fetchApi('/api/admin/stats');
  },
  
  async getPendingFeeds(page = 1, pageSize = 20): Promise<PaginatedResponse<Feed>> {
    return fetchApi<PaginatedResponse<Feed>>(`/api/admin/feeds/pending?page=${page}&pageSize=${pageSize}`);
  },
  
  async reviewFeed(feedId: string, status: 'active' | 'rejected', rejectionReason?: string): Promise<Feed> {
    return fetchApi<Feed>(`/api/admin/feeds/${feedId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, rejectionReason }),
    });
  },
  
  async updateFeed(feedId: string, data: Partial<Feed>): Promise<Feed> {
    return fetchApi<Feed>(`/api/admin/feeds/${feedId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  async triggerFeedUpdate(feedId: string, analyze = true): Promise<{ queued: boolean; queueId: string; analyze: boolean }> {
    return fetchApi(`/api/admin/feeds/${feedId}/update`, { 
      method: 'POST', 
      body: JSON.stringify({ analyze }) 
    });
  },
  
  async triggerAllFeedUpdates(analyze = false): Promise<{ queued: number; analyze: boolean }> {
    console.log(`[Admin API] Triggering all feed updates (analyze: ${analyze})...`);
    const result = await fetchApi<{ queued: number; analyze: boolean }>('/api/admin/feeds/update-all', { 
      method: 'POST',
      body: JSON.stringify({ analyze }),
    });
    console.log('[Admin API] Result:', result);
    return result;
  },
  
  async getUsers(filters?: { role?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
    return fetchApi<PaginatedResponse<User>>(`/api/admin/users?${params}`);
  },
  
  async updateUser(userId: string, data: { role?: string; points?: number }): Promise<User> {
    return fetchApi<User>(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  async getSettings(): Promise<Record<string, unknown>> {
    return fetchApi('/api/admin/settings');
  },
  
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await fetchApi('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
  
  async getLogs(filters?: { page?: number; pageSize?: number; feedId?: string; success?: boolean }): Promise<PaginatedResponse<FeedFetchLog>> {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
    if (filters?.feedId) params.set('feedId', filters.feedId);
    if (filters?.success !== undefined) params.set('success', filters.success.toString());
    return fetchApi<PaginatedResponse<FeedFetchLog>>(`/api/admin/logs?${params}`);
  },
  
  async bulkImportFeeds(urls: string, autoApprove = false): Promise<{
    imported: number;
    failed: number;
    total: number;
    results: Array<{ url: string; success: boolean; feedId?: string; error?: string }>;
  }> {
    return fetchApi('/api/admin/feeds/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ urls, autoApprove }),
    });
  },
  
  async getQueue(filters?: { page?: number; pageSize?: number; status?: string }): Promise<{
    data: QueueItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    stats: QueueStats;
  }> {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', filters.page.toString());
    if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
    if (filters?.status) params.set('status', filters.status);
    return fetchApi(`/api/admin/queue?${params}`);
  },
  
  async clearQueue(status: 'completed' | 'failed' | 'all' = 'completed'): Promise<{ deleted: number; status: string }> {
    return fetchApi(`/api/admin/queue/clear?status=${status}`, { method: 'DELETE' });
  },
  
  async retryFailedQueue(): Promise<{ retried: number }> {
    return fetchApi('/api/admin/queue/retry-failed', { method: 'POST' });
  },
  
  // Text Ingestor APIs
  async ingestorExtract(text: string): Promise<{ extracted: number; urls: string[]; message?: string }> {
    return fetchApi('/api/admin/ingestor/extract', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
  
  async ingestorValidate(
    urls: string[],
    onProgress?: (current: number, total: number) => void,
    onResult?: (result: ValidationResult) => void,
    options?: { timeoutMs?: number; concurrency?: number }
  ): Promise<{
    total: number;
    valid: number;
    existing: number;
    invalid: number;
    results: ValidationResult[];
  }> {
    const { timeoutMs = 15000, concurrency = 5 } = options || {};
    
    // Use streaming if callbacks are provided
    if (onProgress || onResult) {
      return ingestorValidateStream(urls, onProgress, onResult, { timeoutMs, concurrency });
    }
    
    return fetchApi('/api/admin/ingestor/validate', {
      method: 'POST',
      body: JSON.stringify({ urls, timeoutMs, concurrency }),
    });
  },
  
  async ingestorImport(
    urls: string[],
    autoApprove = false,
    onProgress?: (current: number, total: number) => void,
    onResult?: (result: ImportResult) => void
  ): Promise<{
    imported: number;
    failed: number;
    total: number;
    results: ImportResult[];
  }> {
    // Use streaming if callbacks are provided
    if (onProgress || onResult) {
      return ingestorImportStream(urls, autoApprove, onProgress, onResult);
    }
    
    return fetchApi('/api/admin/ingestor/import', {
      method: 'POST',
      body: JSON.stringify({ urls, autoApprove }),
    });
  },
};

// Types for ingestor results
type ValidationResult = {
  url: string;
  isValid: boolean;
  exists: boolean;
  existingFeedId?: string;
  feedInfo?: {
    title?: string;
    description?: string;
    siteUrl?: string;
    imageUrl?: string;
    language?: string;
    postingFrequency?: string;
    postsPerWeek?: number;
    itemCount?: number;
  };
  error?: string;
};

type ImportResult = {
  url: string;
  success: boolean;
  feedId?: string;
  error?: string;
};

// SSE streaming helper for validation
async function ingestorValidateStream(
  urls: string[],
  onProgress?: (current: number, total: number) => void,
  onResult?: (result: ValidationResult) => void,
  options?: { timeoutMs?: number; concurrency?: number }
): Promise<{
  total: number;
  valid: number;
  existing: number;
  invalid: number;
  results: ValidationResult[];
}> {
  const { accessToken } = getTokens();
  const apiUrl = getApiUrl();
  const { timeoutMs = 15000, concurrency = 5 } = options || {};
  
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    
    fetch(`${apiUrl}/api/admin/ingestor/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ urls, stream: true, timeoutMs, concurrency }),
      signal: controller.signal,
    }).then(response => {
      if (!response.ok) {
        throw new Error('Validation request failed');
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      const processChunk = (chunk: string) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (currentEvent === 'progress' && onProgress) {
              onProgress(data.current, data.total);
            } else if (currentEvent === 'result' && onResult) {
              onResult(data);
            } else if (currentEvent === 'complete') {
              resolve(data);
            }
          }
        }
      };
      
      const read = (): Promise<void> => {
        return reader.read().then(({ done, value }) => {
          if (done) {
            if (buffer) processChunk(buffer);
            return;
          }
          processChunk(decoder.decode(value, { stream: true }));
          return read();
        });
      };
      
      read().catch(reject);
    }).catch(reject);
  });
}

// SSE streaming helper for import
async function ingestorImportStream(
  urls: string[],
  autoApprove: boolean,
  onProgress?: (current: number, total: number) => void,
  onResult?: (result: ImportResult) => void
): Promise<{
  imported: number;
  failed: number;
  total: number;
  results: ImportResult[];
}> {
  const { accessToken } = getTokens();
  const apiUrl = getApiUrl();
  
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    
    fetch(`${apiUrl}/api/admin/ingestor/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ urls, autoApprove, stream: true }),
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) {
        let errorMessage = `Import request failed (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Response wasn't JSON, use status text
          errorMessage = `Import request failed: ${response.statusText || response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      const processChunk = (chunk: string) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (currentEvent === 'progress' && onProgress) {
              onProgress(data.current, data.total);
            } else if (currentEvent === 'result' && onResult) {
              onResult(data);
            } else if (currentEvent === 'complete') {
              resolve(data);
            }
          }
        }
      };
      
      const read = (): Promise<void> => {
        return reader.read().then(({ done, value }) => {
          if (done) {
            if (buffer) processChunk(buffer);
            return;
          }
          processChunk(decoder.decode(value, { stream: true }));
          return read();
        });
      };
      
      read().catch(reject);
    }).catch(reject);
  });
}
