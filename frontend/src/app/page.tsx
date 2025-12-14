'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Clock, Star, ArrowRight, Rss, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedList } from '@/components/feeds';
import { useFeedStore, useUIStore, useAuthStore } from '@/store';
import { mockCategories } from '@/lib/mock-data';
import { categoriesApi, statsApi } from '@/lib/api';
import type { Category } from '@/types';

interface SiteStats {
  feeds: number;
  users: number;
  categories: number;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export default function Home() {
  const { feeds, isLoading, fetchFeeds } = useFeedStore();
  const [categories, setCategories] = useState<Category[]>(USE_MOCK ? mockCategories : []);
  const [stats, setStats] = useState<SiteStats | null>(USE_MOCK ? { feeds: 10, users: 5, categories: 15 } : null);

  useEffect(() => {
    fetchFeeds();
    if (!USE_MOCK) {
      categoriesApi.getCategories()
        .then(data => setCategories(data))
        .catch(console.error);
      statsApi.getStats()
        .then(data => setStats(data))
        .catch(console.error);
    }
  }, [fetchFeeds]);
  const { openSubmitFeedModal } = useUIStore();
  const { isAuthenticated } = useAuthStore();

  const activeFeeds = feeds.filter(f => f.status === 'active');
  const trendingFeeds = [...activeFeeds].sort((a, b) => b.score - a.score).slice(0, 5);
  const recentFeeds = [...activeFeeds].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);
  const topRatedFeeds = [...activeFeeds].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5);

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading feeds...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Discover the Best <span className="text-primary">RSS Feeds</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Community-curated directory of RSS feeds, powered by AI categorization.
          Find, share, and vote on quality content sources.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/discover">
            <Button size="lg" className="gap-2">
              <Rss className="h-5 w-5" />
              Explore Feeds
            </Button>
          </Link>
          {isAuthenticated ? (
            <Button size="lg" variant="outline" onClick={openSubmitFeedModal} className="gap-2">
              Submit a Feed
              <ArrowRight className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/categories">
              <Button size="lg" variant="outline" className="gap-2">
                Browse Categories
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-full bg-primary/10">
              <Rss className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats?.feeds ?? activeFeeds.length}</p>
              <p className="text-sm text-muted-foreground">Active Feeds</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats?.users?.toLocaleString() ?? '—'}</p>
              <p className="text-sm text-muted-foreground">Community Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-full bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats?.categories ?? categories.length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Feed Tabs */}
      <section className="mb-12">
        <Tabs defaultValue="trending" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="trending" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="top" className="gap-2">
                <Star className="h-4 w-4" />
                Top Rated
              </TabsTrigger>
            </TabsList>
            <Link href="/discover">
              <Button variant="ghost" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <TabsContent value="trending">
            <FeedList feeds={trendingFeeds} />
          </TabsContent>
          <TabsContent value="recent">
            <FeedList feeds={recentFeeds} />
          </TabsContent>
          <TabsContent value="top">
            <FeedList feeds={topRatedFeeds} />
          </TabsContent>
        </Tabs>
      </section>

      {/* Categories Preview */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Popular Categories</h2>
          <Link href="/categories">
            <Button variant="ghost" className="gap-2">
              All Categories
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.filter(c => !c.parentId).slice(0, 8).map((category) => (
            <Link key={category.id} href={`/category/${category.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                  <p className="text-sm text-primary mt-2">
                    {category.feedCount} feeds
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Know a great RSS feed?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">
          Help the community discover quality content. Submit your favorite feeds
          and earn points for approved submissions.
        </p>
        {isAuthenticated ? (
          <Button size="lg" onClick={openSubmitFeedModal} className="gap-2">
            <Rss className="h-5 w-5" />
            Submit a Feed
          </Button>
        ) : (
          <Button size="lg" className="gap-2" onClick={() => useUIStore.getState().openRegisterModal()}>
            Join the Community
          </Button>
        )}
      </section>
    </div>
  );
}
