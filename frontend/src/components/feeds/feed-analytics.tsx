'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Tags,
  Image,
  FileAudio,
  Clock,
  FileText,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Podcast,
  BarChart3,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { feedsApi } from '@/lib/api';
import type { FeedAnalytics } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';

interface FeedAnalyticsProps {
  feedId: string;
}

function FeatureCard({
  icon: Icon,
  title,
  enabled,
  percentage,
  count,
  description,
}: {
  icon: React.ElementType;
  title: string;
  enabled: boolean;
  percentage: number;
  count?: number;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <div className={`p-2 rounded-lg ${enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {enabled ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        {enabled && (
          <>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={percentage} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-10 text-right">{percentage}%</span>
            </div>
            {count !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {count} unique {title.toLowerCase()}
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TopItemsList({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: { name: string; count: number }[];
  icon: React.ElementType;
}) {
  if (items.length === 0) return null;
  
  const maxCount = Math.max(...items.map(i => i.count));
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.slice(0, 5).map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm truncate">{item.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {item.count}
                </Badge>
              </div>
              <Progress 
                value={(item.count / maxCount) * 100} 
                className="h-1 mt-1" 
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function FeedAnalyticsPanel({ feedId }: FeedAnalyticsProps) {
  const [analytics, setAnalytics] = useState<FeedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      const data = await feedsApi.getFeedAnalytics(feedId, refresh);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [feedId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4 mx-auto block"
            onClick={() => fetchAnalytics()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const { summary, features, content, topAuthors, topCategories, mediaTypes, isPodcast } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Feed Analytics
          </h3>
          {analytics.analyzedAt && (
            <p className="text-sm text-muted-foreground">
              Last analyzed {formatDistanceToNow(new Date(analytics.analyzedAt), { addSuffix: true })}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Total Posts</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summary.totalPosts.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Authors</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summary.uniqueAuthors}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tags className="h-4 w-4" />
              <span className="text-sm">Categories</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summary.uniqueCategories}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Date Range</span>
            </div>
            {summary.dateRange.oldest && summary.dateRange.newest ? (
              <p className="text-sm font-medium mt-1">
                {format(new Date(summary.dateRange.oldest), 'MMM yyyy')} - {format(new Date(summary.dateRange.newest), 'MMM yyyy')}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feed Type Badge */}
      {isPodcast && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Podcast className="h-3 w-3" />
            Podcast Feed
          </Badge>
          {features.durations.totalDurationSeconds && (
            <Badge variant="outline">
              Total: {formatDuration(features.durations.totalDurationSeconds)}
            </Badge>
          )}
          {features.durations.avgDurationSeconds && (
            <Badge variant="outline">
              Avg: {formatDuration(features.durations.avgDurationSeconds)}
            </Badge>
          )}
        </div>
      )}

      {/* Feature Usage Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Usage</CardTitle>
          <CardDescription>
            What metadata this feed provides for its posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FeatureCard
              icon={Users}
              title="Authors"
              enabled={features.authors.enabled}
              percentage={features.authors.percentage}
              count={features.authors.count}
            />
            <FeatureCard
              icon={Tags}
              title="Categories"
              enabled={features.categories.enabled}
              percentage={features.categories.percentage}
              count={features.categories.count}
            />
            <FeatureCard
              icon={Image}
              title="Media"
              enabled={features.media.enabled}
              percentage={features.media.percentage}
            />
            <FeatureCard
              icon={Image}
              title="Thumbnails"
              enabled={features.thumbnails.enabled}
              percentage={features.thumbnails.percentage}
            />
            <FeatureCard
              icon={FileAudio}
              title="Enclosures"
              enabled={features.enclosures.enabled}
              percentage={features.enclosures.percentage}
              description={isPodcast ? 'Audio/Video files' : undefined}
            />
            <FeatureCard
              icon={Clock}
              title="Durations"
              enabled={features.durations.enabled}
              percentage={features.durations.percentage}
              description={features.durations.avgDurationSeconds 
                ? `Avg: ${formatDuration(features.durations.avgDurationSeconds)}`
                : undefined
              }
            />
            <FeatureCard
              icon={FileText}
              title="Full Content"
              enabled={features.fullContent.enabled}
              percentage={features.fullContent.percentage}
            />
            <FeatureCard
              icon={MessageSquare}
              title="Comments URL"
              enabled={features.comments.percentage > 0}
              percentage={features.comments.percentage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Content Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{content.postsWithContent.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Posts with Content</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {content.avgContentLength ? content.avgContentLength.toLocaleString() : '-'}
              </p>
              <p className="text-sm text-muted-foreground">Avg Content Length</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {content.avgTitleLength ?? '-'}
              </p>
              <p className="text-sm text-muted-foreground">Avg Title Length</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TopItemsList
          title="Top Authors"
          items={topAuthors}
          icon={Users}
        />
        <TopItemsList
          title="Top Categories"
          items={topCategories}
          icon={Tags}
        />
        <TopItemsList
          title="Media Types"
          items={mediaTypes.map(m => ({ name: m.type, count: m.count }))}
          icon={FileAudio}
        />
      </div>
    </div>
  );
}
