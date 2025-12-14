'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTags } from '@/lib/mock-data';
import { tagsApi } from '@/lib/api';
import type { Tag as TagType } from '@/types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export default function TagsPage() {
  const [tags, setTags] = useState<TagType[]>(USE_MOCK ? mockTags : []);
  const [isLoading, setIsLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return;
    tagsApi.getTags(undefined, 100)
      .then(data => {
        setTags(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch tags:', err);
        setIsLoading(false);
      });
  }, []);

  const sortedTags = [...tags].sort((a, b) => b.usageCount - a.usageCount);

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tags...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">All Tags</h1>
        </div>
        <p className="text-muted-foreground">
          Browse feeds by community tags
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popular Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {sortedTags.map((tag) => (
              <Link key={tag.id} href={`/tag/${tag.slug}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm py-2 px-4"
                >
                  #{tag.name}
                  <span className="ml-2 text-muted-foreground">
                    {tag.usageCount}
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
