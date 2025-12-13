import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container px-4 py-16 text-center">
      <FileQuestion className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
        <Link href="/discover">
          <Button variant="outline">Browse Feeds</Button>
        </Link>
      </div>
    </div>
  );
}
