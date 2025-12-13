'use client';

import Link from 'next/link';
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Heart,
  ExternalLink,
  Clock,
  Rss,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Feed } from '@/types';
import { cn } from '@/lib/utils';
import { useAuthStore, useFeedStore, useUIStore } from '@/store';
import { formatDistanceToNow } from 'date-fns';

interface FeedCardProps {
  feed: Feed;
  variant?: 'default' | 'compact';
}

export function FeedCard({ feed, variant = 'default' }: FeedCardProps) {
  const { isAuthenticated } = useAuthStore();
  const { voteFeed, toggleFavorite } = useFeedStore();
  const { openLoginModal } = useUIStore();

  const handleVote = (value: 1 | -1) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    voteFeed(feed.id, value);
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    toggleFavorite(feed.id);
  };

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Voting */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', feed.userVote === 1 && 'text-primary')}
                onClick={() => handleVote(1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <span className={cn(
                'text-sm font-semibold',
                feed.score > 0 && 'text-primary',
                feed.score < 0 && 'text-destructive'
              )}>
                {feed.score}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', feed.userVote === -1 && 'text-destructive')}
                onClick={() => handleVote(-1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <Link href={`/feed/${feed.id}`} className="group">
                <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                  {feed.title}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {feed.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {feed.commentCount}
                </span>
                {feed.postsPerWeek && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {feed.postsPerWeek}/week
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Rss className="h-4 w-4 text-primary flex-shrink-0" />
              <Link href={`/feed/${feed.id}`} className="group flex-1 min-w-0">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                  {feed.title}
                </h3>
              </Link>
              {feed.siteUrl && (
                <a
                  href={feed.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {feed.description}
            </p>
          </div>

          {/* Voting */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', feed.userVote === 1 && 'text-primary bg-primary/10')}
              onClick={() => handleVote(1)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className={cn(
              'text-sm font-bold',
              feed.score > 0 && 'text-primary',
              feed.score < 0 && 'text-destructive'
            )}>
              {feed.score}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', feed.userVote === -1 && 'text-destructive bg-destructive/10')}
              onClick={() => handleVote(-1)}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Categories & Tags */}
        <div className="flex flex-wrap gap-2">
          {feed.categories.slice(0, 3).map((category) => (
            <Link key={category.id} href={`/category/${category.slug}`}>
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                {category.name}
              </Badge>
            </Link>
          ))}
          {feed.tags.slice(0, 3).map((tag) => (
            <Link key={tag.id} href={`/tag/${tag.slug}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                #{tag.name}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          {feed.contentType && (
            <Badge variant="outline" className="capitalize">
              {feed.contentType}
            </Badge>
          )}
          {feed.postsPerWeek !== undefined && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {feed.postsPerWeek} posts/week
            </span>
          )}
          {feed.lastPostAt && (
            <span>
              Last post {formatDistanceToNow(new Date(feed.lastPostAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          {/* Submitter */}
          {feed.submittedBy && (
            <Link
              href={`/profile/${feed.submittedBy.id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={feed.submittedBy.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {feed.submittedBy.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span>{feed.submittedBy.displayName}</span>
            </Link>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1',
                feed.isFavorited && 'text-red-500'
              )}
              onClick={handleFavorite}
            >
              <Heart className={cn('h-4 w-4', feed.isFavorited && 'fill-current')} />
            </Button>
            <Link href={`/feed/${feed.id}#comments`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                {feed.commentCount}
              </Button>
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
