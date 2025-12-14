import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rss, Users, Globe, Heart, Github, Linkedin } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About | FeedPulse',
  description: 'Learn about FeedPulse - a community-driven RSS feed discovery and cataloging platform.',
};

export default function AboutPage() {
  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Rss className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">About FeedPulse</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A community-driven platform for discovering, cataloging, and sharing the best RSS feeds on the web.
          </p>
        </div>

        {/* Mission Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              In an age of algorithmic feeds and social media noise, RSS remains one of the most powerful 
              tools for consuming content on your own terms. FeedPulse was created to help people discover 
              high-quality RSS feeds and build their own curated information diet.
            </p>
            <p>
              We believe in the open web, user autonomy, and the power of community curation. Our platform 
              combines human expertise with intelligent analysis to surface the best content sources across 
              every topic imaginable.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Community Driven
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our catalog is built and maintained by passionate RSS enthusiasts who submit, vote on, 
                and review feeds to ensure quality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" />
                Open & Accessible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                FeedPulse is free to use. Export your favorite feeds as OPML and use them with any 
                RSS reader of your choice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Rss className="h-5 w-5 text-primary" />
                Smart Discovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our intelligent categorization and tagging system helps you find feeds that match 
                your interests quickly and easily.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Creator Section */}
        <Card>
          <CardHeader>
            <CardTitle>Created By</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Thiago M Pinto</h3>
                <p className="text-muted-foreground mb-3">
                  Principal Software Engineer at Indeed, based in Ireland. Originally from Brazil, 
                  Thiago is a tech enthusiast who builds projects like FeedPulse in his spare time 
                  to explore new technologies and solve real problems.
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://github.com/madpin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                  <a
                    href="https://linkedin.com/in/madpin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open Source Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Open Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              FeedPulse is open source! Check out the code, report issues, or contribute on GitHub.
            </p>
            <a
              href="https://github.com/madpin/feedpulse"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Ready to discover great content?</h2>
          <div className="flex justify-center gap-4">
            <Link
              href="/"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Explore Feeds
            </Link>
            <Link
              href="/categories"
              className="px-6 py-3 border rounded-md hover:bg-muted transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
