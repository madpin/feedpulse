'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  mockFeeds,
  mockUsers,
  mockProposals,
  getPendingFeeds,
} from '@/lib/mock-data';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const pendingFeeds = getPendingFeeds();
  const activeFeeds = mockFeeds.filter(f => f.status === 'active');
  const openProposals = mockProposals.filter(p => p.status === 'open');

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
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
        <Button onClick={handleRefreshAll} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh All Feeds'}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Feeds</p>
                <p className="text-3xl font-bold">{mockFeeds.length}</p>
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
                <p className="text-3xl font-bold">{pendingFeeds.length}</p>
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
                <p className="text-3xl font-bold">{mockUsers.length}</p>
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
            Pending Feeds ({pendingFeeds.length})
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
        </TabsList>

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
                          <h3 className="font-semibold">{feed.title}</h3>
                          <Badge variant="outline">{feed.contentType || 'Unknown'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {feed.description}
                        </p>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {feed.url}
                        </code>
                        {feed.submittedBy && (
                          <div className="flex items-center gap-2 mt-3">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={feed.submittedBy.avatarUrl} />
                              <AvatarFallback>
                                {feed.submittedBy.displayName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              Submitted by {feed.submittedBy.displayName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(feed.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button size="sm">
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
                  {mockProposals.map((proposal) => (
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
                          <Button size="sm" variant="outline">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm">
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
                {mockUsers.map((u) => (
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
                    <Button variant="outline" size="sm">
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
                  { action: 'New user registered', target: 'alice@example.com', time: '3 hours ago', icon: Users, color: 'text-blue-500' },
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
      </Tabs>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span>Settings</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <RefreshCw className="h-6 w-6" />
              <span>Bulk Update</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Rss className="h-6 w-6" />
              <span>Add Feed</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Activity className="h-6 w-6" />
              <span>View Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
