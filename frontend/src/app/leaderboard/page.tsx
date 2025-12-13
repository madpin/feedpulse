'use client';

import Link from 'next/link';
import { Trophy, Medal, Rss, MessageSquare, ThumbsUp, FileEdit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { mockLeaderboard } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 2:
        return 'bg-gray-500/10 border-gray-500/20';
      case 3:
        return 'bg-amber-500/10 border-amber-500/20';
      default:
        return '';
    }
  };

  return (
    <div className="container px-4 py-8">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Community Leaderboard</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Top contributors who help make FeedPulse great. Earn points by submitting feeds,
          writing helpful comments, and proposing improvements.
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {mockLeaderboard.slice(0, 3).map((entry, index) => {
          const positions = [1, 0, 2]; // Display order: 2nd, 1st, 3rd
          const actualIndex = positions[index];
          const leaderEntry = mockLeaderboard[actualIndex];
          
          return (
            <Card
              key={leaderEntry.user.id}
              className={cn(
                'text-center',
                actualIndex === 0 && 'md:order-2 md:-mt-4',
                actualIndex === 1 && 'md:order-1',
                actualIndex === 2 && 'md:order-3',
                getRankBadge(leaderEntry.rank)
              )}
            >
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  {getRankIcon(leaderEntry.rank)}
                </div>
                <Link href={`/profile/${leaderEntry.user.id}`}>
                  <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-background">
                    <AvatarImage src={leaderEntry.user.avatarUrl} />
                    <AvatarFallback className="text-2xl">
                      {leaderEntry.user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Link
                  href={`/profile/${leaderEntry.user.id}`}
                  className="font-semibold text-lg hover:text-primary transition-colors"
                >
                  {leaderEntry.user.displayName}
                </Link>
                <Badge variant="secondary" className="ml-2 capitalize">
                  {leaderEntry.user.role}
                </Badge>
                <p className="text-3xl font-bold text-primary mt-2">
                  {leaderEntry.user.points.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">points</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockLeaderboard.map((entry) => (
              <div
                key={entry.user.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg transition-colors hover:bg-muted/50',
                  entry.rank <= 3 && getRankBadge(entry.rank)
                )}
              >
                {/* Rank */}
                <div className="w-12 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* User Info */}
                <Link
                  href={`/profile/${entry.user.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <Avatar>
                    <AvatarImage src={entry.user.avatarUrl} />
                    <AvatarFallback>
                      {entry.user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate hover:text-primary transition-colors">
                      {entry.user.displayName}
                    </p>
                    <Badge variant="outline" className="capitalize text-xs">
                      {entry.user.role}
                    </Badge>
                  </div>
                </Link>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1" title="Feeds Submitted">
                    <Rss className="h-4 w-4" />
                    <span>{entry.feedsSubmitted}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Comments">
                    <MessageSquare className="h-4 w-4" />
                    <span>{entry.commentsCount}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Votes Cast">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{entry.votesCast}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Proposals">
                    <FileEdit className="h-4 w-4" />
                    <span>{entry.proposalsApproved}/{entry.proposalsCount}</span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    {entry.user.points.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Points Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">+10</p>
              <p className="font-medium">Submit a feed</p>
              <p className="text-sm text-muted-foreground">When your feed is approved</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">+25</p>
              <p className="font-medium">First to submit</p>
              <p className="text-sm text-muted-foreground">Bonus for unique feeds</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">+5</p>
              <p className="font-medium">Edit proposal</p>
              <p className="text-sm text-muted-foreground">When your edit is approved</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">+2</p>
              <p className="font-medium">Helpful comment</p>
              <p className="text-sm text-muted-foreground">When upvoted by others</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
