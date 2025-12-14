'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Folder, ChevronRight, Rss } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCategoriesWithCounts } from '@/lib/mock-data';
import { categoriesApi } from '@/lib/api';
import type { Category } from '@/types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(USE_MOCK ? getCategoriesWithCounts() : []);
  const [isLoading, setIsLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return;
    categoriesApi.getCategories()
      .then(data => {
        setCategories(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err);
        setIsLoading(false);
      });
  }, []);

  const parentCategories = categories.filter(c => !c.parentId);

  const getSubcategories = (parentId: string) => {
    return categories.filter(c => c.parentId === parentId);
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Categories</h1>
        <p className="text-muted-foreground">
          Explore RSS feeds organized by topic and interest
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parentCategories.map((category) => {
          const subcategories = getSubcategories(category.id);
          
          return (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <Link href={`/category/${category.slug}`} className="group">
                  <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Folder className="h-5 w-5 text-primary" />
                    {category.name}
                    <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </Link>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description}
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  <Rss className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{category.feedCount} feeds</span>
                </div>

                {subcategories.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Subcategories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map((sub) => (
                        <Link key={sub.id} href={`/category/${sub.slug}`}>
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-muted transition-colors"
                          >
                            {sub.name}
                            <span className="ml-1 text-muted-foreground">
                              ({sub.feedCount})
                            </span>
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
