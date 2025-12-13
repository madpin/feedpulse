'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowUp,
  ArrowDown,
  Heart,
  ExternalLink,
  Clock,
  Rss,
  Calendar,
  Globe,
  BarChart3,
  MessageSquare,
  Share2,
  Flag,
  Edit,
  ChevronRight,
  History,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { getFeedById, getCommentsByFeedId, mockFeedPosts, getFeedHistory } from '@/lib/mock-data';
import { FeedHistoryChart } from '@/components/feeds/feed-history-chart';
import { useAuthStore, useFeedStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Comment } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FeedDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const feed = getFeedById(id);
  const comments = getCommentsByFeedId(id);
  const posts = mockFeedPosts.filter(p => p.feedId === id);
  const feedHistory = getFeedHistory(id);

  const { isAuthenticated, user } = useAuthStore();
  const { voteFeed, toggleFavorite } = useFeedStore();
  const { openLoginModal } = useUIStore();

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!feed) {
    notFound();
  }

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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    // Mock submission delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setNewComment('');
    setIsSubmitting(false);
  };

  return (
    <div className="container px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/discover" className="hover:text-foreground">Feeds</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate">{feed.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feed Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* Voting */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-10 w-10', feed.userVote === 1 && 'text-primary bg-primary/10')}
                    onClick={() => handleVote(1)}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                  <span className={cn(
                    'text-xl font-bold',
                    feed.score > 0 && 'text-primary',
                    feed.score < 0 && 'text-destructive'
                  )}>
                    {feed.score}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-10 w-10', feed.userVote === -1 && 'text-destructive bg-destructive/10')}
                    onClick={() => handleVote(-1)}
                  >
                    <ArrowDown className="h-5 w-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Rss className="h-5 w-5 text-primary" />
                        <h1 className="text-2xl font-bold">{feed.title}</h1>
                      </div>
                      {feed.siteUrl && (
                        <a
                          href={feed.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          <Globe className="h-4 w-4" />
                          {new URL(feed.siteUrl).hostname}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(feed.isFavorited && 'text-red-500')}
                        onClick={handleFavorite}
                      >
                        <Heart className={cn('h-5 w-5', feed.isFavorited && 'fill-current')} />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Share2 className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Flag className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-muted-foreground mt-4">
                    {feed.description}
                  </p>

                  {/* Categories & Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {feed.categories.map((category) => (
                      <Link key={category.id} href={`/category/${category.slug}`}>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                    {feed.tags.map((tag) => (
                      <Link key={tag.id} href={`/tag/${tag.slug}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                          #{tag.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>

                  {/* Feed URL */}
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Feed URL</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm flex-1 truncate">{feed.url}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(feed.url)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posting Activity Chart */}
          {feedHistory && feedHistory.dailyStats.length > 0 && (
            <FeedHistoryChart dailyStats={feedHistory.dailyStats} />
          )}

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Recent Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {post.title}
                      </a>
                      {post.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {post.content}
                        </p>
                      )}
                      {post.publishedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No recent posts available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card id="comments">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({feed.commentCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <Textarea
                  placeholder={isAuthenticated ? "Write a comment..." : "Sign in to comment"}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={!isAuthenticated || isSubmitting}
                  className="mb-2"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!isAuthenticated || !newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </form>

              <Separator className="my-6" />

              {/* Comments List */}
              {comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Feed Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Posts per week
                </span>
                <span className="font-medium">{feed.postsPerWeek || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Content type
                </span>
                <Badge variant="outline" className="capitalize">
                  {feed.contentType || 'Unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </span>
                <span className="font-medium uppercase">{feed.language || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last post
                </span>
                <span className="font-medium">
                  {feed.lastPostAt
                    ? formatDistanceToNow(new Date(feed.lastPostAt), { addSuffix: true })
                    : 'N/A'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Upvotes</span>
                <span className="font-medium text-primary">{feed.upvotes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Downvotes</span>
                <span className="font-medium text-destructive">{feed.downvotes}</span>
              </div>
            </CardContent>
          </Card>

          {/* Feed History Card */}
          {feedHistory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Feed History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    First post
                  </span>
                  <span className="font-medium">
                    {feedHistory.firstPostAt
                      ? format(new Date(feedHistory.firstPostAt), 'MMM d, yyyy')
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total posts
                  </span>
                  <span className="font-medium">{feedHistory.totalPosts.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active days</span>
                  <span className="font-medium">{feedHistory.activeDays.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg posts/day</span>
                  <span className="font-medium">{feedHistory.avgPostsPerActiveDay}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Activity</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-muted rounded">
                      <p className="text-lg font-bold">{feedHistory.postsLast7d}</p>
                      <p className="text-xs text-muted-foreground">7 days</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-lg font-bold">{feedHistory.postsLast30d}</p>
                      <p className="text-xs text-muted-foreground">30 days</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-lg font-bold">{feedHistory.postsLast90d}</p>
                      <p className="text-xs text-muted-foreground">90 days</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submitted By Card */}
          {feed.submittedBy && (
            <Card>
              <CardHeader>
                <CardTitle>Submitted By</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/profile/${feed.submittedBy.id}`}
                  className="flex items-center gap-3 hover:bg-muted p-2 rounded-lg transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={feed.submittedBy.avatarUrl} />
                    <AvatarFallback>
                      {feed.submittedBy.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{feed.submittedBy.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {feed.submittedBy.points} points
                    </p>
                  </div>
                </Link>
                {feed.createdAt && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Submitted {format(new Date(feed.createdAt), 'MMM d, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Edit className="h-4 w-4" />
                Propose Edit
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Flag className="h-4 w-4" />
                Report Issue
              </Button>
              <a
                href={feed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Rss className="h-4 w-4" />
                  Subscribe to Feed
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user.avatarUrl} />
          <AvatarFallback>{comment.user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/profile/${comment.user.id}`}
              className="font-medium hover:text-primary"
            >
              {comment.user.displayName}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground">
              Reply
            </Button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-4 border-l-2 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
}
