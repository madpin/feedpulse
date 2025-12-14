'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FeedList } from '@/components/feeds';
import { getCategoryBySlug, getFeedsByCategory, mockCategories } from '@/lib/mock-data';
import { categoriesApi, feedsApi } from '@/lib/api';
import type { Category, Feed } from '@/types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: PageProps) {
  const { slug } = use(params);
  const [category, setCategory] = useState<(Category & { children?: Category[] }) | null | undefined>(
    USE_MOCK ? getCategoryBySlug(slug) : undefined
  );
  const [feeds, setFeeds] = useState<Feed[]>(USE_MOCK ? getFeedsByCategory(slug) : []);
  const [allCategories, setAllCategories] = useState<Category[]>(USE_MOCK ? mockCategories : []);
  const [isLoading, setIsLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return;

    async function fetchData() {
      try {
        // First fetch category by slug to get its ID
        const [categoryData, categoriesData] = await Promise.all([
          categoriesApi.getCategory(slug),
          categoriesApi.getCategories(),
        ]);
        setCategory(categoryData);
        setAllCategories(categoriesData);
        
        // Then fetch feeds using the category ID
        if (categoryData?.id) {
          const feedsData = await feedsApi.getFeeds({ categoryId: categoryData.id, status: 'active' });
          setFeeds(feedsData.data);
        }
      } catch (err) {
        console.error('Failed to fetch category:', err);
        setCategory(null);
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
            <p className="text-muted-foreground">Loading category...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    notFound();
  }

  const subcategories = allCategories.filter(c => c.parentId === category.id);
  const parentCategory = category.parentId
    ? allCategories.find(c => c.id === category.parentId)
    : null;

  return (
    <div className="container px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/categories" className="hover:text-foreground">Categories</Link>
        {parentCategory && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/category/${parentCategory.slug}`} className="hover:text-foreground">
              {parentCategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Folder className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-muted-foreground text-lg">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {feeds.length} feeds in this category
        </p>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Subcategories</h2>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link key={sub.id} href={`/category/${sub.slug}`}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80 text-sm py-1.5 px-3"
                >
                  {sub.name}
                  <span className="ml-2 text-muted-foreground">
                    {sub.feedCount}
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Feed List */}
      <FeedList feeds={feeds} />
    </div>
  );
}
