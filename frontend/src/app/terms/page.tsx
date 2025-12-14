import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, AlertTriangle, Scale, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | FeedPulse',
  description: 'FeedPulse terms of service - rules and guidelines for using our platform.',
};

export default function TermsPage() {
  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <FileText className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Welcome to FeedPulse! These Terms of Service (&quot;Terms&quot;) govern your use of the FeedPulse 
              website at{' '}
              <a href="https://feedpulse.madpin.dev" className="text-primary hover:underline">
                feedpulse.madpin.dev
              </a>{' '}
              (&quot;Service&quot;). By accessing or using our Service, you agree to be bound by these Terms.
            </p>
          </CardContent>
        </Card>

        {/* Acceptance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Acceptance of Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              By creating an account or using FeedPulse, you confirm that you are at least 13 years old 
              and agree to comply with these Terms. If you do not agree with any part of these Terms, 
              you may not use our Service.
            </p>
          </CardContent>
        </Card>

        {/* What You Can Do */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              What You Can Do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              FeedPulse grants you a limited, non-exclusive license to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Browse and search the RSS feed catalog</li>
              <li>Create an account and maintain a profile</li>
              <li>Submit RSS feeds for inclusion in our catalog</li>
              <li>Vote on and review feeds</li>
              <li>Save favorites and export them as OPML</li>
              <li>Participate in community discussions</li>
            </ul>
          </CardContent>
        </Card>

        {/* Prohibited Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Prohibited Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Submit spam, malicious feeds, or misleading content</li>
              <li>Manipulate votes or create fake accounts</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Scrape or collect data without permission</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service for any illegal purpose</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Interfere with the proper functioning of the Service</li>
            </ul>
          </CardContent>
        </Card>

        {/* User Content */}
        <Card>
          <CardHeader>
            <CardTitle>User Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              When you submit feeds, comments, or other content to FeedPulse:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>You retain ownership of your original content</li>
              <li>You grant FeedPulse a license to display and distribute your submissions</li>
              <li>You confirm you have the right to share the content</li>
              <li>Your public submissions (feeds, votes, comments) are visible to all users</li>
            </ul>
            <p className="text-muted-foreground">
              We reserve the right to remove content that violates these Terms or is otherwise objectionable.
            </p>
          </CardContent>
        </Card>

        {/* Account Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle>Account Responsibilities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
              <li>Providing accurate information when registering</li>
            </ul>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Disclaimers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              FeedPulse is provided &quot;as is&quot; without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>The accuracy or quality of submitted feeds</li>
              <li>Uninterrupted or error-free service</li>
              <li>That the Service will meet your specific requirements</li>
            </ul>
            <p className="text-muted-foreground">
              We are not responsible for the content of external RSS feeds linked from our platform. 
              Each feed is owned and operated by its respective publisher.
            </p>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Limitation of Liability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, FeedPulse and its creators shall not be liable 
              for any indirect, incidental, special, consequential, or punitive damages resulting from 
              your use of or inability to use the Service.
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card>
          <CardHeader>
            <CardTitle>Termination</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We may suspend or terminate your account at any time for violations of these Terms or 
              for any other reason at our discretion. You may also delete your account at any time 
              through your account settings. Upon termination, your right to use the Service will 
              immediately cease.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. We will notify users of significant changes by 
              posting a notice on the Service. Your continued use of FeedPulse after changes become 
              effective constitutes acceptance of the new Terms.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you have questions about these Terms, please contact us at:{' '}
              <a href="mailto:legal@feedpulse.madpin.dev" className="text-primary hover:underline">
                legal@feedpulse.madpin.dev
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            See also our{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
