'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowLeft,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { FeedList } from '@/components/feeds';
import { useFeedStore } from '@/store';
import { getCategoriesWithCounts, mockTags } from '@/lib/mock-data';
import { categoriesApi, tagsApi } from '@/lib/api';
import type { Category, Tag } from '@/types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

type SortOption = 'score' | 'recent' | 'posts' | 'alphabetical';

const CONTENT_TYPES = ['news', 'blog', 'podcast', 'newsletter', 'video'];
const POSTING_FREQUENCIES = ['hourly', 'daily', 'weekly', 'monthly'];
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
];

function AdvancedSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { feeds, isLoading: feedsLoading, fetchFeeds } = useFeedStore();

  // Load categories and tags
  const [categories, setCategories] = useState<Category[]>(
    USE_MOCK ? getCategoriesWithCounts() : []
  );
  const [tags, setTags] = useState<Tag[]>(USE_MOCK ? mockTags : []);
  const [isLoading, setIsLoading] = useState(!USE_MOCK);

  // Initialize filters from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('categories')?.split(',').filter(Boolean) || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(
    searchParams.get('contentTypes')?.split(',').filter(Boolean) || []
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    searchParams.get('languages')?.split(',').filter(Boolean) || []
  );
  const [selectedFrequencies, setSelectedFrequencies] = useState<string[]>(
    searchParams.get('frequencies')?.split(',').filter(Boolean) || []
  );
  const [minPostsPerWeek, setMinPostsPerWeek] = useState(
    searchParams.get('minPosts') || ''
  );
  const [maxPostsPerWeek, setMaxPostsPerWeek] = useState(
    searchParams.get('maxPosts') || ''
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sortBy') as SortOption) || 'score'
  );

  // Fetch data on mount
  useEffect(() => {
    fetchFeeds();
    if (!USE_MOCK) {
      Promise.all([
        categoriesApi.getCategories(),
        tagsApi.getPopularTags(50),
      ])
        .then(([cats, tgs]) => {
          setCategories(cats);
          setTags(tgs);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch filter data:', err);
          setIsLoading(false);
        });
    }
  }, [fetchFeeds]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategories.length)
      params.set('categories', selectedCategories.join(','));
    if (selectedTags.length) params.set('tags', selectedTags.join(','));
    if (selectedContentTypes.length)
      params.set('contentTypes', selectedContentTypes.join(','));
    if (selectedLanguages.length)
      params.set('languages', selectedLanguages.join(','));
    if (selectedFrequencies.length)
      params.set('frequencies', selectedFrequencies.join(','));
    if (minPostsPerWeek) params.set('minPosts', minPostsPerWeek);
    if (maxPostsPerWeek) params.set('maxPosts', maxPostsPerWeek);
    if (sortBy !== 'score') params.set('sortBy', sortBy);

    const queryString = params.toString();
    router.replace(`/search/advanced${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    });
  }, [
    router,
    searchQuery,
    selectedCategories,
    selectedTags,
    selectedContentTypes,
    selectedLanguages,
    selectedFrequencies,
    minPostsPerWeek,
    maxPostsPerWeek,
    sortBy,
  ]);

  // Debounced URL update
  useEffect(() => {
    const timer = setTimeout(updateURL, 300);
    return () => clearTimeout(timer);
  }, [updateURL]);

  // Filter feeds
  const activeFeeds = feeds.filter((f) => f.status === 'active');

  const filteredFeeds = useMemo(() => {
    let result = [...activeFeeds];

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query) ||
          f.siteUrl?.toLowerCase().includes(query)
      );
    }

    // Category filter (OR logic - feed must have at least one selected category)
    if (selectedCategories.length > 0) {
      result = result.filter((f) =>
        f.categories.some((c) => selectedCategories.includes(c.slug))
      );
    }

    // Tags filter (OR logic - feed must have at least one selected tag)
    if (selectedTags.length > 0) {
      result = result.filter((f) =>
        f.tags.some((t) => selectedTags.includes(t.slug))
      );
    }

    // Content type filter
    if (selectedContentTypes.length > 0) {
      result = result.filter(
        (f) => f.contentType && selectedContentTypes.includes(f.contentType)
      );
    }

    // Language filter
    if (selectedLanguages.length > 0) {
      result = result.filter(
        (f) => f.language && selectedLanguages.includes(f.language)
      );
    }

    // Posting frequency filter
    if (selectedFrequencies.length > 0) {
      result = result.filter(
        (f) =>
          f.postingFrequency && selectedFrequencies.includes(f.postingFrequency)
      );
    }

    // Posts per week range
    if (minPostsPerWeek) {
      const min = parseFloat(minPostsPerWeek);
      result = result.filter((f) => (f.postsPerWeek || 0) >= min);
    }
    if (maxPostsPerWeek) {
      const max = parseFloat(maxPostsPerWeek);
      result = result.filter((f) => (f.postsPerWeek || 0) <= max);
    }

    // Sorting
    switch (sortBy) {
      case 'score':
        result.sort((a, b) => b.score - a.score);
        break;
      case 'recent':
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'posts':
        result.sort((a, b) => (b.postsPerWeek || 0) - (a.postsPerWeek || 0));
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [
    activeFeeds,
    searchQuery,
    selectedCategories,
    selectedTags,
    selectedContentTypes,
    selectedLanguages,
    selectedFrequencies,
    minPostsPerWeek,
    maxPostsPerWeek,
    sortBy,
  ]);

  // Toggle helpers
  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  };

  const toggleContentType = (type: string) => {
    setSelectedContentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const toggleFrequency = (freq: string) => {
    setSelectedFrequencies((prev) =>
      prev.includes(freq) ? prev.filter((f) => f !== freq) : [...prev, freq]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedContentTypes([]);
    setSelectedLanguages([]);
    setSelectedFrequencies([]);
    setMinPostsPerWeek('');
    setMaxPostsPerWeek('');
    setSortBy('score');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategories.length > 0 ||
    selectedTags.length > 0 ||
    selectedContentTypes.length > 0 ||
    selectedLanguages.length > 0 ||
    selectedFrequencies.length > 0 ||
    minPostsPerWeek ||
    maxPostsPerWeek;

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    selectedTags.length +
    selectedContentTypes.length +
    selectedLanguages.length +
    selectedFrequencies.length +
    (minPostsPerWeek ? 1 : 0) +
    (maxPostsPerWeek ? 1 : 0);

  // Parent categories only for the filter
  const parentCategories = categories.filter((c) => !c.parentId);

  if (feedsLoading || isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter panel component (shared between desktop and mobile)
  const FilterPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`space-y-6 ${isMobile ? '' : 'sticky top-24'}`}>
      <Accordion
        type="multiple"
        defaultValue={['categories', 'tags', 'contentType', 'language']}
        className="w-full"
      >
        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-medium">
            Categories
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedCategories.length}
              </Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {parentCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${category.slug}`}
                    checked={selectedCategories.includes(category.slug)}
                    onCheckedChange={() => toggleCategory(category.slug)}
                  />
                  <Label
                    htmlFor={`cat-${category.slug}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {category.name}
                    <span className="text-muted-foreground ml-1">
                      ({category.feedCount})
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tags */}
        <AccordionItem value="tags">
          <AccordionTrigger className="text-sm font-medium">
            Tags
            {selectedTags.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedTags.length}
              </Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {tags.map((tag) => (
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
          </AccordionContent>
        </AccordionItem>

        {/* Content Type */}
        <AccordionItem value="contentType">
          <AccordionTrigger className="text-sm font-medium">
            Content Type
            {selectedContentTypes.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedContentTypes.length}
              </Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {CONTENT_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedContentTypes.includes(type)}
                    onCheckedChange={() => toggleContentType(type)}
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className="text-sm cursor-pointer capitalize"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Language */}
        <AccordionItem value="language">
          <AccordionTrigger className="text-sm font-medium">
            Language
            {selectedLanguages.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedLanguages.length}
              </Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {LANGUAGES.map((lang) => (
                <div key={lang.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${lang.code}`}
                    checked={selectedLanguages.includes(lang.code)}
                    onCheckedChange={() => toggleLanguage(lang.code)}
                  />
                  <Label
                    htmlFor={`lang-${lang.code}`}
                    className="text-sm cursor-pointer"
                  >
                    {lang.name}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Posting Frequency */}
        <AccordionItem value="frequency">
          <AccordionTrigger className="text-sm font-medium">
            Posting Frequency
            {selectedFrequencies.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedFrequencies.length}
              </Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {POSTING_FREQUENCIES.map((freq) => (
                <div key={freq} className="flex items-center space-x-2">
                  <Checkbox
                    id={`freq-${freq}`}
                    checked={selectedFrequencies.includes(freq)}
                    onCheckedChange={() => toggleFrequency(freq)}
                  />
                  <Label
                    htmlFor={`freq-${freq}`}
                    className="text-sm cursor-pointer capitalize"
                  >
                    {freq}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Posts Per Week */}
        <AccordionItem value="postsPerWeek">
          <AccordionTrigger className="text-sm font-medium">
            Posts Per Week
            {(minPostsPerWeek || maxPostsPerWeek) && (
              <Badge variant="secondary" className="ml-2">
                Range
              </Badge>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor="minPosts" className="text-xs text-muted-foreground">
                  Minimum
                </Label>
                <Input
                  id="minPosts"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minPostsPerWeek}
                  onChange={(e) => setMinPostsPerWeek(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxPosts" className="text-xs text-muted-foreground">
                  Maximum
                </Label>
                <Input
                  id="maxPosts"
                  type="number"
                  min="0"
                  placeholder="No limit"
                  value={maxPostsPerWeek}
                  onChange={(e) => setMaxPostsPerWeek(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {hasActiveFilters && (
        <>
          <Separator />
          <Button variant="outline" className="w-full" onClick={clearAllFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="container px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Filter className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Advanced Search</h1>
        </div>
        <p className="text-muted-foreground">
          Find feeds using multiple filters. All filters are preserved in the URL
          for easy sharing and back navigation.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title, description, or URL..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
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

          {/* Mobile Filters Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanel isMobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden md:block w-72 flex-shrink-0">
          <FilterPanel />
        </aside>

        {/* Results */}
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
              {selectedCategories.map((slug) => {
                const cat = categories.find((c) => c.slug === slug);
                return (
                  <Badge key={slug} variant="secondary" className="gap-1">
                    {cat?.name || slug}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleCategory(slug)}
                    />
                  </Badge>
                );
              })}
              {selectedTags.map((slug) => (
                <Badge key={slug} variant="secondary" className="gap-1">
                  #{slug}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleTag(slug)}
                  />
                </Badge>
              ))}
              {selectedContentTypes.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1 capitalize">
                  {type}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleContentType(type)}
                  />
                </Badge>
              ))}
              {selectedLanguages.map((code) => {
                const lang = LANGUAGES.find((l) => l.code === code);
                return (
                  <Badge key={code} variant="secondary" className="gap-1">
                    {lang?.name || code}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleLanguage(code)}
                    />
                  </Badge>
                );
              })}
              {selectedFrequencies.map((freq) => (
                <Badge key={freq} variant="secondary" className="gap-1 capitalize">
                  {freq}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFrequency(freq)}
                  />
                </Badge>
              ))}
              {(minPostsPerWeek || maxPostsPerWeek) && (
                <Badge variant="secondary" className="gap-1">
                  Posts: {minPostsPerWeek || '0'} - {maxPostsPerWeek || '∞'}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setMinPostsPerWeek('');
                      setMaxPostsPerWeek('');
                    }}
                  />
                </Badge>
              )}
            </div>
          )}

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredFeeds.length} of {activeFeeds.length} feeds
          </p>

          {/* Feed List */}
          {filteredFeeds.length > 0 ? (
            <FeedList feeds={filteredFeeds} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No feeds found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdvancedSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <AdvancedSearchContent />
    </Suspense>
  );
}
