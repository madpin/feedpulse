'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  LayoutDashboard,
  Rss,
  Users,
  FileEdit,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  RefreshCw,
  Upload,
  ListTodo,
  Loader2,
  Trash2,
  RotateCcw,
  Timer,
  Zap,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  mockFeeds,
  mockUsers,
  mockProposals,
  getPendingFeeds,
} from '@/lib/mock-data';
import { adminApi, proposalsApi } from '@/lib/api';
import { useAuthStore, useUIStore } from '@/store';
import { useRouter } from 'next/navigation';
import type { Feed, User, Proposal, QueueItem, QueueStats } from '@/types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { openSubmitFeedModal } = useUIStore();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [refreshingFeedId, setRefreshingFeedId] = useState<string | null>(null);
  const [pendingFeeds, setPendingFeeds] = useState<Feed[]>(USE_MOCK ? getPendingFeeds() : []);
  const [allFeeds, setAllFeeds] = useState<Feed[]>(USE_MOCK ? mockFeeds : []);
  const [users, setUsers] = useState<User[]>(USE_MOCK ? mockUsers : []);
  const [proposals, setProposals] = useState<Proposal[]>(USE_MOCK ? mockProposals : []);
  const [isLoading, setIsLoading] = useState(!USE_MOCK);
  
  // Bulk import state
  const [bulkUrls, setBulkUrls] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    imported: number;
    failed: number;
    total: number;
    results: Array<{ url: string; success: boolean; feedId?: string; error?: string }>;
  } | null>(null);
  
  // Queue state
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [queueFilter, setQueueFilter] = useState<string>('');
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isClearingQueue, setIsClearingQueue] = useState(false);
  const [isRetryingFailed, setIsRetryingFailed] = useState(false);

  useEffect(() => {
    if (USE_MOCK) return;
    if (!isAuthenticated || user?.role !== 'admin') return;

    async function fetchData() {
      try {
        const [pendingData, usersData, proposalsData, statsData] = await Promise.all([
          adminApi.getPendingFeeds(),
          adminApi.getUsers(),
          proposalsApi.getProposals({ status: 'open' }),
          adminApi.getStats(),
        ]);
        setPendingFeeds(pendingData.data);
        setUsers(usersData.data);
        setProposals(proposalsData.data);
        // Use stats to set allFeeds count approximation
        if (statsData.feeds) {
          const totalFeeds = Object.values(statsData.feeds).reduce((a, b) => a + b, 0);
          setAllFeeds(new Array(totalFeeds).fill({}) as Feed[]);
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isAuthenticated, user?.role]);

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="container px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeFeeds = allFeeds.filter(f => f.status === 'active');
  const openProposals = proposals.filter(p => p.status === 'open');

  const handleRefreshAll = async (analyze = false) => {
    if (USE_MOCK) {
      if (analyze) {
        setIsReanalyzing(true);
      } else {
        setIsRefreshing(true);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsRefreshing(false);
      setIsReanalyzing(false);
      return;
    }
    
    if (analyze) {
      setIsReanalyzing(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const result = await adminApi.triggerAllFeedUpdates(analyze);
      console.log(`Queued ${result.queued} feeds for update (analyze: ${result.analyze})`);
    } catch (err) {
      console.error('Failed to trigger bulk update:', err);
    } finally {
      setIsRefreshing(false);
      setIsReanalyzing(false);
    }
  };

  const handleRefreshFeed = async (feedId: string, analyze = true) => {
    if (USE_MOCK) {
      setRefreshingFeedId(feedId);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setRefreshingFeedId(null);
      return;
    }
    
    setRefreshingFeedId(feedId);
    try {
      const result = await adminApi.triggerFeedUpdate(feedId, analyze);
      console.log(`Queued feed ${feedId} for update (analyze: ${result.analyze})`);
    } catch (err) {
      console.error('Failed to trigger feed update:', err);
    } finally {
      setRefreshingFeedId(null);
    }
  };

  const handleApproveFeed = async (feedId: string) => {
    if (USE_MOCK) return;
    try {
      await adminApi.reviewFeed(feedId, 'active');
      setPendingFeeds(prev => prev.filter(f => f.id !== feedId));
    } catch (err) {
      console.error('Failed to approve feed:', err);
    }
  };

  const handleRejectFeed = async (feedId: string) => {
    if (USE_MOCK) return;
    try {
      await adminApi.reviewFeed(feedId, 'rejected');
      setPendingFeeds(prev => prev.filter(f => f.id !== feedId));
    } catch (err) {
      console.error('Failed to reject feed:', err);
    }
  };

  const handleApproveProposal = async (proposalId: string) => {
    if (USE_MOCK) return;
    // TODO: Implement proposal approval API
    console.log('Approve proposal:', proposalId);
    setProposals(prev => prev.map(p => 
      p.id === proposalId ? { ...p, status: 'approved' as const } : p
    ));
  };

  const handleRejectProposal = async (proposalId: string) => {
    if (USE_MOCK) return;
    // TODO: Implement proposal rejection API
    console.log('Reject proposal:', proposalId);
    setProposals(prev => prev.map(p => 
      p.id === proposalId ? { ...p, status: 'rejected' as const } : p
    ));
  };

  const handleBulkImport = async () => {
    if (!bulkUrls.trim()) return;
    
    setIsImporting(true);
    setImportResults(null);
    
    try {
      const results = await adminApi.bulkImportFeeds(bulkUrls, autoApprove);
      setImportResults(results);
      
      // Refresh pending feeds if not auto-approving
      if (!autoApprove && results.imported > 0) {
        const pendingData = await adminApi.getPendingFeeds();
        setPendingFeeds(pendingData.data);
      }
      
      // Clear the input on success
      if (results.imported > 0) {
        setBulkUrls('');
      }
    } catch (err) {
      console.error('Bulk import failed:', err);
      setImportResults({
        imported: 0,
        failed: 0,
        total: 0,
        results: [{ url: 'Error', success: false, error: String(err) }],
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Queue handlers
  const fetchQueue = async (status?: string) => {
    if (USE_MOCK) return;
    setIsLoadingQueue(true);
    try {
      const result = await adminApi.getQueue({ status: status || undefined, pageSize: 50 });
      setQueueItems(result.data);
      setQueueStats(result.stats);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const handleClearQueue = async (status: 'completed' | 'failed' | 'all') => {
    if (USE_MOCK) return;
    setIsClearingQueue(true);
    try {
      const result = await adminApi.clearQueue(status);
      console.log(`Cleared ${result.deleted} ${result.status} queue items`);
      await fetchQueue(queueFilter);
    } catch (err) {
      console.error('Failed to clear queue:', err);
    } finally {
      setIsClearingQueue(false);
    }
  };

  const handleRetryFailed = async () => {
    if (USE_MOCK) return;
    setIsRetryingFailed(true);
    try {
      const result = await adminApi.retryFailedQueue();
      console.log(`Retried ${result.retried} failed items`);
      await fetchQueue(queueFilter);
    } catch (err) {
      console.error('Failed to retry failed items:', err);
    } finally {
      setIsRetryingFailed(false);
    }
  };

  const handleQueueFilterChange = (status: string) => {
    setQueueFilter(status);
    fetchQueue(status);
  };

  return (
    <div className="container px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage feeds, users, and platform settings
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/ingestor">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Feed Ingestor
            </Button>
          </Link>
          <Button onClick={() => handleRefreshAll(false)} disabled={isRefreshing || isReanalyzing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh All'}
          </Button>
          <Button onClick={() => handleRefreshAll(true)} disabled={isRefreshing || isReanalyzing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isReanalyzing ? 'animate-spin' : ''}`} />
            {isReanalyzing ? 'Reanalyzing...' : 'Reanalyze All Feeds'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Feeds</p>
                <p className="text-3xl font-bold">{allFeeds.length}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Rss className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500">+12%</span>
              <span className="text-muted-foreground">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold">{pendingFeeds?.length ?? 0}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500">+8%</span>
              <span className="text-muted-foreground">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Proposals</p>
                <p className="text-3xl font-bold">{openProposals.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <FileEdit className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Need review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Feeds ({pendingFeeds?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="bulk-import" className="gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import
          </TabsTrigger>
          <TabsTrigger value="proposals" className="gap-2">
            <FileEdit className="h-4 w-4" />
            Proposals ({openProposals.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-2" onClick={() => fetchQueue()}>
            <ListTodo className="h-4 w-4" />
            Queue {queueStats ? `(${queueStats.pending + queueStats.processing})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* Bulk Import Tab */}
        <TabsContent value="bulk-import">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Feed Import</CardTitle>
              <CardDescription>
                Import multiple RSS feeds at once. Paste URLs separated by commas, spaces, newlines, or semicolons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-urls">Feed URLs</Label>
                <Textarea
                  id="bulk-urls"
                  placeholder="https://example.com/feed.xml&#10;https://another.com/rss&#10;https://blog.example.org/feed"
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter one URL per line, or separate with commas, spaces, or semicolons.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="auto-approve"
                  checked={autoApprove}
                  onCheckedChange={(checked: boolean) => setAutoApprove(checked)}
                />
                <Label htmlFor="auto-approve" className="text-sm cursor-pointer">
                  Auto-approve imported feeds (skip pending review)
                </Label>
              </div>
              
              <Button 
                onClick={handleBulkImport} 
                disabled={isImporting || !bulkUrls.trim()}
                className="w-full sm:w-auto"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Feeds
                  </>
                )}
              </Button>
              
              {importResults && (
                <div className="mt-6 space-y-4">
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">
                      ✓ {importResults.imported} imported
                    </span>
                    <span className="text-red-600 font-medium">
                      ✗ {importResults.failed} failed
                    </span>
                    <span className="text-muted-foreground">
                      of {importResults.total} total
                    </span>
                  </div>
                  
                  {importResults.results.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                      {importResults.results.map((result, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 text-sm ${result.success ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}
                        >
                          <div className="flex items-start gap-2">
                            {result.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <code className="text-xs break-all">{result.url}</code>
                              {result.error && (
                                <p className="text-xs text-red-600 mt-1">{result.error}</p>
                              )}
                              {result.feedId && (
                                <Link 
                                  href={`/feed/${result.feedId}`}
                                  className="text-xs text-primary hover:underline mt-1 inline-block"
                                >
                                  View feed →
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Feeds Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Feed Submissions</CardTitle>
              <CardDescription>
                Review and approve new feed submissions from the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingFeeds.length > 0 ? (
                <div className="space-y-4">
                  {pendingFeeds.map((feed) => (
                    <div
                      key={feed.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/feed/${feed.id}`} className="font-semibold hover:text-primary hover:underline">
                            {feed.title || 'Untitled Feed'}
                          </Link>
                          <Badge variant="outline">{feed.contentType || 'Unknown'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {feed.description || 'No description available'}
                        </p>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {feed.url}
                        </code>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {feed.language && <span>Language: {feed.language}</span>}
                          {feed.postsPerWeek && <span>Posts/week: {feed.postsPerWeek}</span>}
                          {feed.postingFrequency && <span>Frequency: {feed.postingFrequency}</span>}
                        </div>
                        {feed.submittedBy && (
                          <div className="flex items-center gap-2 mt-3">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={feed.submittedBy.avatarUrl} />
                              <AvatarFallback>
                                {feed.submittedBy.displayName?.charAt(0) ?? '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              Submitted by {feed.submittedBy.displayName ?? 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(feed.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link href={`/feed/${feed.id}`}>
                          <Button size="sm" variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRefreshFeed(feed.id, true)}
                          disabled={refreshingFeedId === feed.id}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${refreshingFeedId === feed.id ? 'animate-spin' : ''}`} />
                          {refreshingFeedId === feed.id ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectFeed(feed.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button size="sm" onClick={() => handleApproveFeed(feed.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No pending submissions. All caught up!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals">
          <Card>
            <CardHeader>
              <CardTitle>Community Proposals</CardTitle>
              <CardDescription>
                Review edit proposals and feature requests from contributors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {openProposals.length > 0 ? (
                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{proposal.title}</h3>
                          <Badge variant="outline" className="capitalize">
                            {proposal.type}
                          </Badge>
                          <Badge
                            variant={
                              proposal.status === 'open'
                                ? 'secondary'
                                : proposal.status === 'approved'
                                ? 'default'
                                : 'destructive'
                            }
                            className="capitalize"
                          >
                            {proposal.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {proposal.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-green-500">
                            +{proposal.votesFor} for
                          </span>
                          <span className="text-red-500">
                            -{proposal.votesAgainst} against
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={proposal.user.avatarUrl} />
                            <AvatarFallback>
                              {proposal.user.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            by {proposal.user.displayName}
                          </span>
                        </div>
                      </div>
                      {proposal.status === 'open' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleRejectProposal(proposal.id)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm" onClick={() => handleApproveProposal(proposal.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No open proposals
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <Avatar>
                      <AvatarImage src={u.avatarUrl} />
                      <AvatarFallback>{u.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{u.displayName}</p>
                        <Badge
                          variant={
                            u.role === 'admin'
                              ? 'destructive'
                              : u.role === 'contributor'
                              ? 'default'
                              : 'secondary'
                          }
                          className="capitalize"
                        >
                          {u.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">{u.points} pts</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {format(new Date(u.createdAt), 'MMM yyyy')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users/${u.id}`)}>
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Platform activity and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Feed approved', target: 'Hacker News', time: '2 hours ago', icon: CheckCircle, color: 'text-green-500' },
                  { action: 'New user registered', target: 'alice@madpin.dev', time: '3 hours ago', icon: Users, color: 'text-blue-500' },
                  { action: 'Feed submitted', target: 'New Tech Blog', time: '5 hours ago', icon: Rss, color: 'text-primary' },
                  { action: 'Proposal approved', target: 'Add RSS export', time: '1 day ago', icon: FileEdit, color: 'text-purple-500' },
                  { action: 'Feed rejected', target: 'Spam Feed', time: '1 day ago', icon: XCircle, color: 'text-red-500' },
                ].map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.action}</span>
                          {' - '}
                          <span className="text-muted-foreground">{activity.target}</span>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue">
          <div className="space-y-6">
            {/* Queue Stats Cards */}
            {queueStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Pending</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{queueStats.pending}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      <span className="text-sm text-muted-foreground">Processing</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{queueStats.processing}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Completed</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{queueStats.completed}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-muted-foreground">Failed</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{queueStats.failed}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Last 24h</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{queueStats.completedLast24h}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-muted-foreground">Failed 24h</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{queueStats.failedLast24h}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Avg Time</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {queueStats.avgProcessingTimeMs ? `${(queueStats.avgProcessingTimeMs / 1000).toFixed(1)}s` : '-'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Queue Actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Queue Items</CardTitle>
                    <CardDescription>
                      View and manage feed update queue
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fetchQueue(queueFilter)}
                      disabled={isLoadingQueue}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingQueue ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    {queueStats && queueStats.failed > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRetryFailed}
                        disabled={isRetryingFailed}
                      >
                        <RotateCcw className={`h-4 w-4 mr-1 ${isRetryingFailed ? 'animate-spin' : ''}`} />
                        Retry Failed ({queueStats.failed})
                      </Button>
                    )}
                    {queueStats && queueStats.completed > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleClearQueue('completed')}
                        disabled={isClearingQueue}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear Completed
                      </Button>
                    )}
                    {queueStats && (queueStats.completed > 0 || queueStats.failed > 0) && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleClearQueue('all')}
                        disabled={isClearingQueue}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All Done
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filter buttons */}
                <div className="flex gap-2 mb-4">
                  <Button 
                    variant={queueFilter === '' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleQueueFilterChange('')}
                  >
                    All
                  </Button>
                  <Button 
                    variant={queueFilter === 'pending' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleQueueFilterChange('pending')}
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={queueFilter === 'processing' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleQueueFilterChange('processing')}
                  >
                    Processing
                  </Button>
                  <Button 
                    variant={queueFilter === 'completed' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleQueueFilterChange('completed')}
                  >
                    Completed
                  </Button>
                  <Button 
                    variant={queueFilter === 'failed' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => handleQueueFilterChange('failed')}
                  >
                    Failed
                  </Button>
                </div>

                {/* Queue items list */}
                {isLoadingQueue ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : queueItems.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {queueItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 p-3 border rounded-lg ${
                          item.status === 'failed' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' :
                          item.status === 'processing' ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' :
                          item.status === 'completed' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' :
                          ''
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {item.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                          {item.status === 'processing' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                          {item.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {item.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.feed ? (
                              <Link href={`/feed/${item.feedId}`} className="font-medium hover:text-primary hover:underline truncate">
                                {item.feed.title || item.feed.url}
                              </Link>
                            ) : (
                              <span className="font-medium truncate">{item.feedId}</span>
                            )}
                            <Badge variant="outline" className="capitalize text-xs">
                              {item.status}
                            </Badge>
                            {item.priority > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Priority: {item.priority}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>Created: {format(new Date(item.createdAt), 'MMM d, HH:mm:ss')}</span>
                            {item.startedAt && (
                              <span>Started: {format(new Date(item.startedAt), 'HH:mm:ss')}</span>
                            )}
                            {item.completedAt && (
                              <span>Completed: {format(new Date(item.completedAt), 'HH:mm:ss')}</span>
                            )}
                            {item.triggerer && (
                              <span>By: {item.triggerer.displayName}</span>
                            )}
                          </div>
                          {item.errorMessage && (
                            <p className="text-xs text-red-600 mt-1 truncate" title={item.errorMessage}>
                              Error: {item.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {queueFilter ? `No ${queueFilter} items in queue` : 'Queue is empty'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => router.push('/admin/settings')}>
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => handleRefreshAll(true)}
              disabled={isRefreshing || isReanalyzing}
            >
              <RefreshCw className={`h-6 w-6 ${isReanalyzing ? 'animate-spin' : ''}`} />
              <span>{isReanalyzing ? 'Reanalyzing...' : 'Reanalyze All'}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={openSubmitFeedModal}>
              <Rss className="h-6 w-6" />
              <span>Add Feed</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => router.push('/admin/logs')}>
              <Activity className="h-6 w-6" />
              <span>View Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
