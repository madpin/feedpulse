import { create } from 'zustand';
import type { User, Feed, Notification } from '@/types';
import { currentUser, mockNotifications, mockFeeds } from '@/lib/mock-data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

interface FeedState {
  feeds: Feed[];
  voteFeed: (feedId: string, value: 1 | -1) => void;
  toggleFavorite: (feedId: string) => void;
  submitFeed: (url: string) => Promise<Feed>;
}

interface UIState {
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  isSubmitFeedModalOpen: boolean;
  isMobileMenuOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  openSubmitFeedModal: () => void;
  closeSubmitFeedModal: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: currentUser,
  isAuthenticated: !!currentUser,
  login: async (email: string, _password: string) => {
    // Mock login - in real app would call API
    await new Promise(resolve => setTimeout(resolve, 500));
    if (email) {
      set({ 
        user: { ...currentUser!, email }, 
        isAuthenticated: true 
      });
      return true;
    }
    return false;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  register: async (email: string, _password: string, displayName: string) => {
    // Mock register - in real app would call API
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
  },
}));

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter(n => !n.read).length,
  markAsRead: (id: string) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: state.notifications.filter(n => !n.read && n.id !== id).length,
    }));
  },
  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));

export const useFeedStore = create<FeedState>((set, get) => ({
  feeds: mockFeeds,
  voteFeed: (feedId: string, value: 1 | -1) => {
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
  },
  toggleFavorite: (feedId: string) => {
    set(state => ({
      feeds: state.feeds.map(feed => 
        feed.id === feedId 
          ? { ...feed, isFavorited: !feed.isFavorited }
          : feed
      ),
    }));
  },
  submitFeed: async (url: string) => {
    // Mock feed submission
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
  },
}));

export const useUIStore = create<UIState>((set) => ({
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isSubmitFeedModalOpen: false,
  isMobileMenuOpen: false,
  openLoginModal: () => set({ isLoginModalOpen: true, isRegisterModalOpen: false }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  openRegisterModal: () => set({ isRegisterModalOpen: true, isLoginModalOpen: false }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false }),
  openSubmitFeedModal: () => set({ isSubmitFeedModalOpen: true }),
  closeSubmitFeedModal: () => set({ isSubmitFeedModalOpen: false }),
  toggleMobileMenu: () => set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));
