'use client';

import { Clock } from 'lucide-react';
import { FeedList } from '@/components/feeds';
import { useFeedStore } from '@/store';

export default function RecentPage() {
  const { feeds } = useFeedStore();

  const recentFeeds = feeds
    .filter(f => f.status === 'active')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Recently Added</h1>
        </div>
        <p className="text-muted-foreground">
          Newest feeds added to the directory
        </p>
      </div>

      <FeedList feeds={recentFeeds} />
    </div>
  );
}
