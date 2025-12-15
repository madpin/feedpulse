import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container px-4 py-16 text-center">
      <div className="h-24 w-24 mx-auto mb-6 flex items-center justify-center text-6xl">
        🔍
      </div>
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4 justify-center">
        <Link 
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go Home
        </Link>
        <Link 
          href="/discover"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Browse Feeds
        </Link>
      </div>
    </div>
  );
}
