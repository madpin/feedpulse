'use client';

import Link from 'next/link';
import { Folder, ChevronRight, Rss } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCategories } from '@/lib/mock-data';

export default function CategoriesPage() {
  const parentCategories = mockCategories.filter(c => !c.parentId);

  const getSubcategories = (parentId: string) => {
    return mockCategories.filter(c => c.parentId === parentId);
  };

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
