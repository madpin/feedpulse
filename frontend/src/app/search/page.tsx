'use client';

import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { FeedList } from '@/components/feeds';
import { searchFeeds } from '@/lib/mock-data';
import { Suspense } from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const results = query ? searchFeeds(query) : [];

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Search Results</h1>
        </div>
        {query && (
          <p className="text-muted-foreground">
            {results.length} results for &quot;{query}&quot;
          </p>
        )}
      </div>

      {query ? (
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
