import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Github, MessageSquare, Bug, Lightbulb } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact | FeedPulse',
  description: 'Get in touch with the FeedPulse team.',
};

export default function ContactPage() {
  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions, feedback, or want to report an issue? We&apos;d love to hear from you.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The best way to report bugs, request features, or contribute to FeedPulse is through 
                our GitHub repository.
              </p>
              <div className="space-y-3">
                <a
                  href="https://github.com/madpin/feedpulse/issues/new?template=bug_report.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Bug className="h-4 w-4" />
                  Report a Bug
                </a>
                <a
                  href="https://github.com/madpin/feedpulse/issues/new?template=feature_request.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Lightbulb className="h-4 w-4" />
                  Request a Feature
                </a>
                <a
                  href="https://github.com/madpin/feedpulse/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <MessageSquare className="h-4 w-4" />
                  Join Discussions
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For general inquiries, partnerships, or private matters, you can reach us via email.
              </p>
              <a
                href="mailto:contact@feedpulse.madpin.dev"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-4 w-4" />
                contact@feedpulse.madpin.dev
              </a>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How do I submit a new feed?</h3>
              <p className="text-muted-foreground">
                Click the &quot;Submit Feed&quot; button in the navigation bar. You&apos;ll need to create an account 
                first if you haven&apos;t already. Simply paste the RSS feed URL and our system will 
                automatically analyze and categorize it.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How does the voting system work?</h3>
              <p className="text-muted-foreground">
                Registered users can upvote or downvote feeds based on quality. Feeds with higher 
                scores appear more prominently in search results and category listings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I export my favorite feeds?</h3>
              <p className="text-muted-foreground">
                Yes! You can export your favorited feeds as an OPML file, which can be imported 
                into any RSS reader application.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is FeedPulse free to use?</h3>
              <p className="text-muted-foreground">
                Yes, FeedPulse is completely free to use. We&apos;re an open-source project built by 
                the community, for the community.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Notice */}
        <div className="text-center text-muted-foreground">
          <p>
            We typically respond to inquiries within 48 hours. For urgent issues, please use GitHub Issues.
          </p>
        </div>
      </div>
    </div>
  );
}
