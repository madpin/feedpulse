'use client';

import Link from 'next/link';
import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTags } from '@/lib/mock-data';

export default function TagsPage() {
  const sortedTags = [...mockTags].sort((a, b) => b.usageCount - a.usageCount);

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
