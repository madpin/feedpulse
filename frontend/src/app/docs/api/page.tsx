import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Key, Database, Zap, Globe, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Documentation | FeedPulse',
  description: 'FeedPulse API documentation - integrate with our RSS feed catalog.',
};

export default function ApiDocsPage() {
  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Code className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">API Documentation</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Integrate FeedPulse data into your applications with our REST API.
          </p>
        </div>

        {/* Base URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Base URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="block bg-muted p-4 rounded-lg text-sm">
              https://feedpulse.madpin.dev/api/v1
            </code>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Most read endpoints are publicly accessible. Write operations require authentication 
              using a Bearer token.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-mono mb-2">Authorization Header:</p>
              <code className="text-sm">Authorization: Bearer YOUR_ACCESS_TOKEN</code>
            </div>
            <p className="text-muted-foreground text-sm">
              Obtain tokens by authenticating via the <code>/auth/login</code> endpoint.
            </p>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feeds */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Feeds</h3>
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-mono rounded">GET</span>
                    <code className="text-sm">/feeds</code>
                  </div>
                  <p className="text-sm text-muted-foreground">List all feeds with pagination and filtering</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-mono rounded">GET</span>
                    <code className="text-sm">/feeds/:id</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Get a specific feed by ID</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 text-xs font-mono rounded">POST</span>
                    <code className="text-sm">/feeds</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Submit a new feed (requires auth)</p>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Categories</h3>
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-mono rounded">GET</span>
                    <code className="text-sm">/categories</code>
                  </div>
                  <p className="text-sm text-muted-foreground">List all categories</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-mono rounded">GET</span>
                    <code className="text-sm">/categories/:slug/feeds</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Get feeds in a specific category</p>
                </div>
              </div>
            </div>

            {/* Votes */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Votes</h3>
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 text-xs font-mono rounded">POST</span>
                    <code className="text-sm">/feeds/:id/vote</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Vote on a feed (requires auth)</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Search</h3>
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs font-mono rounded">GET</span>
                    <code className="text-sm">/search?q=query</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Search feeds by title, description, or URL</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Response Format
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              All responses are returned in JSON format. Successful responses include the requested data, 
              while errors include an error message and code.
            </p>
            <div>
              <p className="text-sm font-semibold mb-2">Success Response:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}`}
              </pre>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Error Response:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              API requests are rate limited to ensure fair usage:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Anonymous:</strong> 100 requests per hour</li>
              <li><strong>Authenticated:</strong> 1000 requests per hour</li>
            </ul>
            <p className="text-muted-foreground mt-4 text-sm">
              Rate limit headers are included in all responses: <code>X-RateLimit-Limit</code>, 
              <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>
            </p>
          </CardContent>
        </Card>

        {/* More Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              More Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="https://github.com/madpin/feedpulse"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <p className="font-medium">GitHub Repository</p>
                <p className="text-sm text-muted-foreground">View source code and contribute</p>
              </a>
              <a
                href="/docs/best-practices"
                className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <p className="font-medium">RSS Best Practices</p>
                <p className="text-sm text-muted-foreground">Learn about RSS feed standards</p>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center text-muted-foreground">
          <p>
            Need help? Open an issue on{' '}
            <a 
              href="https://github.com/madpin/feedpulse/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub
            </a>
            {' '}or contact us at{' '}
            <a href="mailto:api@feedpulse.madpin.dev" className="text-primary hover:underline">
              api@feedpulse.madpin.dev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
