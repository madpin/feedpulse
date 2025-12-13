'use client';

import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { FeedList } from '@/components/feeds';
import { useFeedStore } from '@/store';
import { mockCategories, mockTags } from '@/lib/mock-data';

type SortOption = 'score' | 'recent' | 'posts' | 'alphabetical';

export default function DiscoverPage() {
  const { feeds } = useFeedStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const activeFeeds = feeds.filter(f => f.status === 'active');

  const filteredFeeds = useMemo(() => {
    let result = [...activeFeeds];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        f =>
          f.title.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query) ||
          f.categories.some(c => c.name.toLowerCase().includes(query)) ||
          f.tags.some(t => t.name.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(f =>
        f.categories.some(c => c.slug === selectedCategory)
      );
    }

    // Content type filter
    if (selectedContentType !== 'all') {
      result = result.filter(f => f.contentType === selectedContentType);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      result = result.filter(f =>
        selectedTags.some(tagSlug => f.tags.some(t => t.slug === tagSlug))
      );
    }

    // Sorting
    switch (sortBy) {
      case 'score':
        result.sort((a, b) => b.score - a.score);
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'posts':
        result.sort((a, b) => (b.postsPerWeek || 0) - (a.postsPerWeek || 0));
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [activeFeeds, searchQuery, selectedCategory, selectedContentType, selectedTags, sortBy]);

  const contentTypes = [...new Set(activeFeeds.map(f => f.contentType).filter(Boolean))];

  const toggleTag = (tagSlug: string) => {
    setSelectedTags(prev =>
      prev.includes(tagSlug)
        ? prev.filter(t => t !== tagSlug)
        : [...prev, tagSlug]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedContentType('all');
    setSelectedTags([]);
    setSortBy('score');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'all' ||
    selectedContentType !== 'all' ||
    selectedTags.length > 0;

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Feeds</h1>
        <p className="text-muted-foreground">
          Browse and search through {activeFeeds.length} community-curated RSS feeds
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search feeds..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {mockCategories.filter(c => !c.parentId).map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Top Rated</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="posts">Most Active</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Content Type</h3>
                  <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {contentTypes.map((type) => (
                        <SelectItem key={type} value={type!}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {mockTags.slice(0, 12).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.slug) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag.slug)}
                      >
                        #{tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Filters Sidebar */}
      <div className="flex gap-8">
        {/* Filters Panel - Desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="font-medium mb-3">Content Type</h3>
              <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {contentTypes.map((type) => (
                    <SelectItem key={type} value={type!}>
                      <span className="capitalize">{type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {mockTags.slice(0, 12).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.slug) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.slug)}
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <>
                <Separator />
                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </>
            )}
          </div>
        </aside>

        {/* Feed List */}
        <div className="flex-1">
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {mockCategories.find(c => c.slug === selectedCategory)?.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedCategory('all')}
                  />
                </Badge>
              )}
              {selectedContentType !== 'all' && (
                <Badge variant="secondary" className="gap-1 capitalize">
                  {selectedContentType}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedContentType('all')}
                  />
                </Badge>
              )}
              {selectedTags.map((tagSlug) => (
                <Badge key={tagSlug} variant="secondary" className="gap-1">
                  #{tagSlug}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleTag(tagSlug)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredFeeds.length} of {activeFeeds.length} feeds
          </p>

          <FeedList feeds={filteredFeeds} />
        </div>
      </div>
    </div>
  );
}
