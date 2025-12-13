'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FeedList } from '@/components/feeds';
import { useFeedStore, useAuthStore, useUIStore } from '@/store';

export default function FavoritesPage() {
  const { feeds } = useFeedStore();
  const { isAuthenticated } = useAuthStore();
  const { openLoginModal } = useUIStore();

  const favoriteFeeds = feeds.filter(f => f.isFavorited && f.status === 'active');

  if (!isAuthenticated) {
    return (
      <div className="container px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to see your favorites</h2>
            <p className="text-muted-foreground mb-4">
              Save your favorite feeds for quick access
            </p>
            <Button onClick={openLoginModal}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-3xl font-bold">Your Favorites</h1>
        </div>
        <p className="text-muted-foreground">
          {favoriteFeeds.length} saved feeds
        </p>
      </div>

      {favoriteFeeds.length > 0 ? (
        <FeedList feeds={favoriteFeeds} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground">
              Click the heart icon on any feed to save it here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
