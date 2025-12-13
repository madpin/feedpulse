'use client';

import { TrendingUp } from 'lucide-react';
import { FeedList } from '@/components/feeds';
import { useFeedStore } from '@/store';

export default function TrendingPage() {
  const { feeds } = useFeedStore();

  const trendingFeeds = feeds
    .filter(f => f.status === 'active')
    .sort((a, b) => b.score - a.score);

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Trending Feeds</h1>
        </div>
        <p className="text-muted-foreground">
          Most popular feeds based on community votes
        </p>
      </div>

      <FeedList feeds={trendingFeeds} />
    </div>
  );
}
