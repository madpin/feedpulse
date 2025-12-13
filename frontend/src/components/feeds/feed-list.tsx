'use client';

import { FeedCard } from './feed-card';
import type { Feed } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface FeedListProps {
  feeds: Feed[];
  variant?: 'default' | 'compact';
  isLoading?: boolean;
}

export function FeedList({ feeds, variant = 'default', isLoading }: FeedListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <FeedCardSkeleton key={i} variant={variant} />
        ))}
      </div>
    );
  }

  if (feeds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No feeds found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feeds.map((feed) => (
        <FeedCard key={feed.id} feed={feed} variant={variant} />
      ))}
    </div>
  );
}

function FeedCardSkeleton({ variant }: { variant: 'default' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <div className="border rounded-lg p-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}
