'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Folder,
  Trophy,
  Heart,
  Clock,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockCategories, mockTags } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const mainNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Trending', href: '/trending', icon: TrendingUp },
  { name: 'Recent', href: '/recent', icon: Clock },
  { name: 'Favorites', href: '/favorites', icon: Heart },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const topCategories = mockCategories.filter(c => !c.parentId).slice(0, 8);
  const topTags = mockTags.slice(0, 10);

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-muted/30 h-[calc(100vh-4rem)] sticky top-16">
      <ScrollArea className="flex-1 px-4 py-6">
        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <Separator className="my-6" />

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Categories
            </h3>
            <Link
              href="/categories"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <nav className="space-y-1">
            {topCategories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                  pathname === `/category/${category.slug}`
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span>{category.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {category.feedCount}
                </Badge>
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="my-6" />

        {/* Popular Tags */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Popular Tags
            </h3>
            <Link
              href="/tags"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <Link key={tag.id} href={`/tag/${tag.slug}`}>
                <Badge
                  variant={pathname === `/tag/${tag.slug}` ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  #{tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
