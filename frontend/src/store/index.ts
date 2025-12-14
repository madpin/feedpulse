import { create } from 'zustand';
import type { User, Feed, Notification } from '@/types';
import { authApi, feedsApi, votesApi, notificationsApi, getTokens, clearTokens } from '@/lib/api';

// For development fallback - import mock data
import { currentUser as mockCurrentUser, mockNotifications, mockFeeds } from '@/lib/mock-data';

// Check if we should use mock data (when API is unavailable)
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

interface FeedState {
  feeds: Feed[];
  isLoading: boolean;
  fetchFeeds: (filters?: Record<string, unknown>) => Promise<void>;
  voteFeed: (feedId: string, value: 1 | -1) => void;
  toggleFavorite: (feedId: string) => void;
  submitFeed: (url: string, categoryIds?: string[]) => Promise<Feed>;
}

interface UIState {
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  isSubmitFeedModalOpen: boolean;
  isMobileMenuOpen: boolean;
  feedHistoryTimeRange: '7d' | '30d' | '90d';
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  openSubmitFeedModal: () => void;
  closeSubmitFeedModal: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  setFeedHistoryTimeRange: (range: '7d' | '30d' | '90d') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: USE_MOCK ? mockCurrentUser : null,
  isAuthenticated: USE_MOCK ? !!mockCurrentUser : false,
  isLoading: !USE_MOCK,
  login: async (email: string, password: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (email) {
        set({ user: { ...mockCurrentUser!, email }, isAuthenticated: true });
        return true;
      }
      return false;
    }
    
    try {
      const { user } = await authApi.login(email, password);
      set({ user, isAuthenticated: true });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  },
  logout: () => {
    if (!USE_MOCK) {
      authApi.logout().catch(console.error);
    }
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },
  register: async (email: string, password: string, displayName: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        displayName,
        role: 'user',
        points: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({ user: newUser, isAuthenticated: true });
      return true;
    }
    
    try {
      const { user } = await authApi.register(email, password, displayName);
      set({ user, isAuthenticated: true });
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  },
  checkAuth: async () => {
    if (USE_MOCK) {
      set({ isLoading: false });
      return;
    }
    
    const { accessToken } = getTokens();
    if (!accessToken) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: USE_MOCK ? mockNotifications : [],
  unreadCount: USE_MOCK ? mockNotifications.filter(n => !n.read).length : 0,
  fetchNotifications: async () => {
    if (USE_MOCK) return;
    try {
      const notifications = await notificationsApi.getNotifications();
      set({ 
        notifications, 
        unreadCount: notifications.filter(n => !n.read).length 
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  },
  markAsRead: (id: string) => {
    if (!USE_MOCK) {
      notificationsApi.markAsRead(id).catch(console.error);
    }
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: state.notifications.filter(n => !n.read && n.id !== id).length,
    }));
  },
  markAllAsRead: () => {
    if (!USE_MOCK) {
      notificationsApi.markAllAsRead().catch(console.error);
    }
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));

export const useFeedStore = create<FeedState>((set, get) => ({
  feeds: USE_MOCK ? mockFeeds : [],
  isLoading: !USE_MOCK,
  fetchFeeds: async (filters?: Record<string, unknown>) => {
    if (USE_MOCK) return;
    set({ isLoading: true });
    try {
      const response = await feedsApi.getFeeds(filters as Parameters<typeof feedsApi.getFeeds>[0]);
      set({ feeds: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch feeds:', error);
      set({ isLoading: false });
    }
  },
  voteFeed: (feedId: string, value: 1 | -1) => {
    // Optimistic update
    set(state => ({
      feeds: state.feeds.map(feed => {
        if (feed.id !== feedId) return feed;
        
        const previousVote = feed.userVote;
        let upvotes = feed.upvotes;
        let downvotes = feed.downvotes;
        
        // Remove previous vote
        if (previousVote === 1) upvotes--;
        if (previousVote === -1) downvotes--;
        
        // If clicking same vote, just remove it
        if (previousVote === value) {
          return {
            ...feed,
            upvotes,
            downvotes,
            score: upvotes - downvotes,
            userVote: null,
          };
        }
        
        // Add new vote
        if (value === 1) upvotes++;
        if (value === -1) downvotes++;
        
        return {
          ...feed,
          upvotes,
          downvotes,
          score: upvotes - downvotes,
          userVote: value,
        };
      }),
    }));
    
    // Call API
    if (!USE_MOCK) {
      votesApi.vote(feedId, value).catch(console.error);
    }
  },
  toggleFavorite: (feedId: string) => {
    // Optimistic update
    set(state => ({
      feeds: state.feeds.map(feed => 
        feed.id === feedId 
          ? { ...feed, isFavorited: !feed.isFavorited }
          : feed
      ),
    }));
    
    // Call API
    if (!USE_MOCK) {
      feedsApi.toggleFavorite(feedId).catch(console.error);
    }
  },
  submitFeed: async (url: string, categoryIds?: string[]) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newFeed: Feed = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        title: 'New Feed (Analyzing...)',
        titleSource: 'llm',
        description: 'Feed content is being analyzed by our AI system.',
        descriptionSource: 'llm',
        status: 'pending',
        categories: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
        score: 0,
        commentCount: 0,
      };
      set(state => ({ feeds: [...state.feeds, newFeed] }));
      return newFeed;
    }
    
    const newFeed = await feedsApi.submitFeed({ url, categoryIds });
    set(state => ({ feeds: [...state.feeds, newFeed] }));
    return newFeed;
  },
}));

export const useUIStore = create<UIState>((set) => ({
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isSubmitFeedModalOpen: false,
  isMobileMenuOpen: false,
  feedHistoryTimeRange: '30d',
  openLoginModal: () => set({ isLoginModalOpen: true, isRegisterModalOpen: false }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  openRegisterModal: () => set({ isRegisterModalOpen: true, isLoginModalOpen: false }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false }),
  openSubmitFeedModal: () => set({ isSubmitFeedModalOpen: true }),
  closeSubmitFeedModal: () => set({ isSubmitFeedModalOpen: false }),
  toggleMobileMenu: () => set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  setFeedHistoryTimeRange: (range) => set({ feedHistoryTimeRange: range }),
}));
