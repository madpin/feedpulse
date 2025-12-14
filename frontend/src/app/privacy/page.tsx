import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Trash2, Cookie, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | FeedPulse',
  description: 'FeedPulse privacy policy - how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              At FeedPulse, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you visit our website at{' '}
              <a href="https://feedpulse.madpin.dev" className="text-primary hover:underline">
                feedpulse.madpin.dev
              </a>
              . Please read this privacy policy carefully.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Personal Information</h3>
              <p className="text-muted-foreground">
                When you register for an account, we collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Email address</li>
                <li>Display name (chosen by you)</li>
                <li>Password (stored securely using industry-standard hashing)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Usage Information</h3>
              <p className="text-muted-foreground">
                We automatically collect certain information when you use FeedPulse:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Feeds you submit, vote on, or favorite</li>
                <li>Comments and reviews you post</li>
                <li>Basic analytics (page views, feature usage)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve FeedPulse</li>
              <li>Create and manage your account</li>
              <li>Enable community features (voting, commenting, submissions)</li>
              <li>Send important service updates (if you opt in)</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle>Data Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We do <strong>not</strong> sell your personal information. We may share information only in these cases:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Public content:</strong> Feeds you submit, votes, and comments are publicly visible</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Service providers:</strong> With trusted third parties who help operate our service (hosting, analytics)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Cookies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We use essential cookies to keep you logged in and remember your preferences. 
              We may use analytics cookies to understand how visitors use our site. 
              You can disable cookies in your browser settings, but some features may not work properly.
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-primary" />
              Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data (including favorited feeds as OPML)</li>
              <li>Opt out of non-essential communications</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us or use the settings in your account dashboard.
            </p>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card>
          <CardHeader>
            <CardTitle>Data Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal 
              information, including encryption in transit (HTTPS), secure password hashing, and 
              regular security reviews. However, no method of transmission over the Internet is 
              100% secure, and we cannot guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or our data practices, please contact us at:{' '}
              <a href="mailto:privacy@feedpulse.madpin.dev" className="text-primary hover:underline">
                privacy@feedpulse.madpin.dev
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Changes Notice */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes 
            by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
          </p>
        </div>
      </div>
    </div>
  );
}
