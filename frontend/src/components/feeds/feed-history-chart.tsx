'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, Activity } from 'lucide-react';
import type { FeedDailyStats } from '@/types';
import { cn } from '@/lib/utils';

interface FeedHistoryChartProps {
  dailyStats: FeedDailyStats[];
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d';

export function FeedHistoryChart({ dailyStats, className }: FeedHistoryChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const filteredStats = useMemo(() => {
    const now = new Date();
    const daysMap: Record<TimeRange, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const days = daysMap[timeRange];
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);

    return dailyStats.filter(stat => {
      const date = parseISO(stat.date);
      return date >= cutoff;
    });
  }, [dailyStats, timeRange]);

  const maxPosts = useMemo(() => {
    return Math.max(...filteredStats.map(s => s.postCount), 1);
  }, [filteredStats]);

  const totalPosts = useMemo(() => {
    return filteredStats.reduce((sum, s) => sum + s.postCount, 0);
  }, [filteredStats]);

  const avgPostsPerDay = useMemo(() => {
    if (filteredStats.length === 0) return 0;
    return (totalPosts / filteredStats.length).toFixed(1);
  }, [filteredStats, totalPosts]);

  if (dailyStats.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Posting Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No posting history available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Posting Activity
          </CardTitle>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{totalPosts}</p>
            <p className="text-xs text-muted-foreground">Total Posts</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{avgPostsPerDay}</p>
            <p className="text-xs text-muted-foreground">Avg/Day</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{filteredStats.length}</p>
            <p className="text-xs text-muted-foreground">Active Days</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="relative">
          <div className="flex items-end gap-[2px] h-32">
            {filteredStats.map((stat, index) => {
              const height = (stat.postCount / maxPosts) * 100;
              return (
                <div
                  key={stat.date}
                  className="flex-1 group relative"
                  title={`${format(parseISO(stat.date), 'MMM d')}: ${stat.postCount} posts`}
                >
                  <div
                    className={cn(
                      'w-full bg-primary/70 hover:bg-primary rounded-t transition-all duration-150',
                      stat.postCount === 0 && 'bg-muted hover:bg-muted'
                    )}
                    style={{ height: `${Math.max(height, stat.postCount > 0 ? 4 : 1)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border">
                      <p className="font-medium">{format(parseISO(stat.date), 'MMM d, yyyy')}</p>
                      <p>{stat.postCount} post{stat.postCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {filteredStats.length > 0 && (
              <>
                <span>{format(parseISO(filteredStats[0].date), 'MMM d')}</span>
                {filteredStats.length > 1 && (
                  <span>{format(parseISO(filteredStats[filteredStats.length - 1].date), 'MMM d')}</span>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
