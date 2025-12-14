'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Tag } from 'lucide-react';
import { FeedList } from '@/components/feeds';
import { getTagBySlug, getFeedsByTag } from '@/lib/mock-data';
import { tagsApi, feedsApi } from '@/lib/api';
import type { Tag as TagType, Feed } from '@/types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TagPage({ params }: PageProps) {
  const { slug } = use(params);
  const [tag, setTag] = useState<TagType | null | undefined>(USE_MOCK ? getTagBySlug(slug) : undefined);
  const [feeds, setFeeds] = useState<Feed[]>(USE_MOCK ? getFeedsByTag(slug) : []);
  const [isLoading, setIsLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return;

    async function fetchData() {
      try {
        const tagData = await tagsApi.getTag(slug);
        setTag(tagData);
        // Only fetch feeds if tag exists
        const feedsData = await feedsApi.getFeeds({ tagId: tagData.id, status: 'active' });
        setFeeds(feedsData.data);
      } catch (err) {
        console.error('Failed to fetch tag:', err);
        setTag(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tag...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tag) {
    notFound();
  }

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
