import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rss, CheckCircle, XCircle, Lightbulb, FileText, Clock, Image, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'RSS Best Practices | FeedPulse',
  description: 'Learn best practices for creating and maintaining high-quality RSS feeds.',
};

export default function BestPracticesPage() {
  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Rss className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">RSS Best Practices</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Guidelines for creating and maintaining high-quality RSS feeds that readers will love.
          </p>
        </div>

        {/* Why RSS Matters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Why RSS Still Matters
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              RSS (Really Simple Syndication) remains one of the most powerful tools for content distribution. 
              Unlike social media algorithms, RSS gives readers complete control over what they see. 
              A well-maintained RSS feed helps you build a loyal audience that directly subscribes to your content.
            </p>
          </CardContent>
        </Card>

        {/* Feed Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Feed Structure Essentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Include a descriptive title</p>
                  <p className="text-sm text-muted-foreground">
                    Your feed title should clearly identify your site or publication.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Write a meaningful description</p>
                  <p className="text-sm text-muted-foreground">
                    Help readers understand what content to expect from your feed.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Link back to your website</p>
                  <p className="text-sm text-muted-foreground">
                    Always include a link to your main website in the feed metadata.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Use valid XML</p>
                  <p className="text-sm text-muted-foreground">
                    Validate your feed regularly to ensure compatibility with all readers.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Item Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Item Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Use unique, permanent GUIDs</p>
                  <p className="text-sm text-muted-foreground">
                    Each item should have a globally unique identifier that never changes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Include full content or meaningful summaries</p>
                  <p className="text-sm text-muted-foreground">
                    Readers prefer full-text feeds. If not possible, provide substantial excerpts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Set accurate publication dates</p>
                  <p className="text-sm text-muted-foreground">
                    Use RFC 822 date format and ensure dates reflect actual publication time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Add author information</p>
                  <p className="text-sm text-muted-foreground">
                    Include author names or emails for multi-author publications.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media & Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Media & Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Rich media enhances the reading experience in modern RSS readers:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Include a feed logo/image (recommended: 144x144 pixels minimum)</li>
              <li>Use media enclosures for podcasts and video content</li>
              <li>Provide image thumbnails for articles when available</li>
              <li>Use absolute URLs for all media references</li>
              <li>Specify MIME types for enclosures</li>
            </ul>
          </CardContent>
        </Card>

        {/* Update Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Update Frequency & Caching
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Set appropriate TTL (Time To Live)</p>
                  <p className="text-sm text-muted-foreground">
                    Tell readers how often to check for updates (in minutes).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Keep a reasonable number of items</p>
                  <p className="text-sm text-muted-foreground">
                    10-50 items is typical. Too few may miss readers; too many wastes bandwidth.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Support conditional GET</p>
                  <p className="text-sm text-muted-foreground">
                    Implement ETag and Last-Modified headers to reduce server load.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Mistakes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Common Mistakes to Avoid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Changing GUIDs when updating content</p>
                  <p className="text-sm text-muted-foreground">
                    This causes items to appear as new, frustrating readers.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Using relative URLs</p>
                  <p className="text-sm text-muted-foreground">
                    Always use absolute URLs for links and media.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Truncating content without indication</p>
                  <p className="text-sm text-muted-foreground">
                    If you truncate, make it clear and link to the full article.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Including tracking pixels or excessive ads</p>
                  <p className="text-sm text-muted-foreground">
                    Keep feeds clean and reader-friendly.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Blocking feed readers with robots.txt</p>
                  <p className="text-sm text-muted-foreground">
                    Ensure your feed URL is accessible to all user agents.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Regularly validate your feed to catch issues early:
            </p>
            <div className="space-y-2">
              <a
                href="https://validator.w3.org/feed/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <p className="font-medium">W3C Feed Validation Service</p>
                <p className="text-sm text-muted-foreground">Official W3C validator for RSS and Atom feeds</p>
              </a>
              <a
                href="https://www.feedvalidator.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <p className="font-medium">Feed Validator</p>
                <p className="text-sm text-muted-foreground">Detailed validation with helpful suggestions</p>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-bold">Have a great RSS feed?</h2>
          <p className="text-muted-foreground">
            Submit it to FeedPulse and help others discover quality content.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Submit Your Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
