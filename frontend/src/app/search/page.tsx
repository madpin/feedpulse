'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedList } from '@/components/feeds';
import { searchFeeds } from '@/lib/mock-data';
import { searchApi } from '@/lib/api';
import { Suspense } from 'react';
import type { Feed } from '@/types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  const [results, setResults] = useState<Feed[]>(USE_MOCK && query ? searchFeeds(query) : []);
  const [isLoading, setIsLoading] = useState(!USE_MOCK && !!query);

  useEffect(() => {
    if (USE_MOCK) {
      setResults(query ? searchFeeds(query) : []);
      return;
    }

    if (!query) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchApi.search(query)
      .then(data => {
        setResults(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Search failed:', err);
        setResults([]);
        setIsLoading(false);
      });
  }, [query]);

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Search className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Search Results</h1>
          </div>
          <Link href={`/search/advanced${query ? `?q=${encodeURIComponent(query)}` : ''}`}>
            <Button variant="outline">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Advanced Search
            </Button>
          </Link>
        </div>
        {query && (
          <p className="text-muted-foreground">
            {results.length} results for &quot;{query}&quot;
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Searching...</p>
          </div>
        </div>
      ) : query ? (
        results.length > 0 ? (
          <FeedList feeds={results} />
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground">
              Try different keywords or browse our categories
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Enter a search term</h2>
          <p className="text-muted-foreground">
            Search for feeds by name, description, category, or tag
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container px-4 py-8">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
