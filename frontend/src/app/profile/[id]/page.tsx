'use client';

import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import {
  Trophy,
  Calendar,
  Rss,
  MessageSquare,
  ThumbsUp,
  FileEdit,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { FeedList } from '@/components/feeds';
import { getUserById, mockFeeds, mockComments, mockLeaderboard } from '@/lib/mock-data';
import { usersApi, commentsApi } from '@/lib/api';
import type { User, Feed, Comment, LeaderboardEntry } from '@/types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const [user, setUser] = useState<(User & { stats?: Record<string, number>; rank?: number }) | null | undefined>(
    USE_MOCK ? getUserById(id) : undefined
  );
  const [userFeeds, setUserFeeds] = useState<Feed[]>(
    USE_MOCK ? mockFeeds.filter(f => f.submittedBy?.id === id && f.status === 'active') : []
  );
  const [userComments, setUserComments] = useState<Comment[]>(
    USE_MOCK ? mockComments.filter(c => c.user.id === id) : []
  );
  const [leaderboardEntry, setLeaderboardEntry] = useState<LeaderboardEntry | undefined>(
    USE_MOCK ? mockLeaderboard.find(e => e.user.id === id) : undefined
  );
  const [isLoading, setIsLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return;

    async function fetchData() {
      try {
        const [userData, feedsData] = await Promise.all([
          usersApi.getUser(id),
          usersApi.getUserFeeds(id),
        ]);
        setUser(userData);
        setUserFeeds(feedsData.data);
        // Create a leaderboard entry from user data
        if (userData.stats && userData.rank) {
          setLeaderboardEntry({
            rank: userData.rank,
            user: userData,
            feedsSubmitted: userData.stats.feedsSubmitted || 0,
            commentsCount: userData.stats.commentsCount || 0,
            votesCast: userData.stats.votesCast || 0,
            proposalsCount: userData.stats.proposalsCount || 0,
            proposalsApproved: userData.stats.proposalsApproved || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    notFound();
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'contributor':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-background">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-3xl">
                {user.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{user.displayName}</h1>
                <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                  {user.role}
                </Badge>
              </div>

              {user.bio && (
                <p className="text-muted-foreground mb-4">{user.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {format(new Date(user.createdAt), 'MMMM yyyy')}
                </div>
                {user.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                )}
              </div>
            </div>

            {/* Points Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-primary">
                  {user.points.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">points</p>
                {leaderboardEntry && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Rank #{leaderboardEntry.rank}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Rss className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{userFeeds.length}</p>
            <p className="text-sm text-muted-foreground">Feeds Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{leaderboardEntry?.commentsCount || 0}</p>
            <p className="text-sm text-muted-foreground">Comments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ThumbsUp className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{leaderboardEntry?.votesCast || 0}</p>
            <p className="text-sm text-muted-foreground">Votes Cast</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileEdit className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {leaderboardEntry?.proposalsApproved || 0}/{leaderboardEntry?.proposalsCount || 0}
            </p>
            <p className="text-sm text-muted-foreground">Proposals</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="feeds" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="feeds" className="gap-2">
            <Rss className="h-4 w-4" />
            Feeds ({userFeeds.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({userComments.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feeds">
          {userFeeds.length > 0 ? (
            <FeedList feeds={userFeeds} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Rss className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No feeds submitted yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comments">
          {userComments.length > 0 ? (
            <div className="space-y-4">
              {userComments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <p className="text-sm mb-2">{comment.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No comments yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userFeeds.slice(0, 3).map((feed) => (
                  <div key={feed.id} className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Rss className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        Submitted <span className="font-medium">{feed.title}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(feed.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
                {userComments.slice(0, 3).map((comment) => (
                  <div key={comment.id} className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm line-clamp-1">
                        Commented: &quot;{comment.content}&quot;
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
                {userFeeds.length === 0 && userComments.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
