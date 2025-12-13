'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Tag } from 'lucide-react';
import { FeedList } from '@/components/feeds';
import { getTagBySlug, getFeedsByTag } from '@/lib/mock-data';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TagPage({ params }: PageProps) {
  const { slug } = use(params);
  const tag = getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const feeds = getFeedsByTag(slug);

  return (
    <div className="container px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/tags" className="hover:text-foreground">Tags</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">#{tag.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">#{tag.name}</h1>
        </div>
        <p className="text-muted-foreground">
          {feeds.length} feeds tagged with #{tag.name}
        </p>
      </div>

      {/* Feed List */}
      <FeedList feeds={feeds} />
    </div>
  );
}
