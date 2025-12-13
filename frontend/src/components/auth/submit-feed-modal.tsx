'use client';

import { useState } from 'react';
import { Rss, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFeedStore, useUIStore } from '@/store';

type SubmissionStep = 'input' | 'analyzing' | 'success' | 'error';

export function SubmitFeedModal() {
  const { submitFeed } = useFeedStore();
  const { isSubmitFeedModalOpen, closeSubmitFeedModal } = useUIStore();
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<SubmissionStep>('input');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setStep('analyzing');

    try {
      await submitFeed(url);
      setStep('success');
    } catch {
      setStep('error');
      setError('Failed to submit feed. Please try again.');
    }
  };

  const handleClose = () => {
    closeSubmitFeedModal();
    // Reset state after animation
    setTimeout(() => {
      setUrl('');
      setNotes('');
      setStep('input');
      setError('');
    }, 200);
  };

  const renderContent = () => {
    switch (step) {
      case 'analyzing':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analyzing Feed...</h3>
            <p className="text-sm text-muted-foreground">
              Our AI is extracting metadata and categorizing your feed.
              This usually takes a few seconds.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Feed Submitted!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your feed has been submitted for review. You&apos;ll be notified
              once it&apos;s approved and earn points!
            </p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="p-3 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Submission Failed</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep('input')}>Try Again</Button>
            </div>
          </div>
        );

      default:
        return (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="feedUrl">RSS Feed URL *</Label>
              <Input
                id="feedUrl"
                type="url"
                placeholder="https://example.com/feed.xml"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL of an RSS or Atom feed. Our AI will automatically
                extract the title, description, and categories.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about this feed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Our AI analyzes the feed content</li>
                <li>• Metadata is automatically extracted</li>
                <li>• Feed enters the approval queue</li>
                <li>• You earn points when approved!</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Submit Feed
              </Button>
            </div>
          </form>
        );
    }
  };

  return (
    <Dialog open={isSubmitFeedModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'input' && (
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Rss className="h-8 w-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl">Submit a Feed</DialogTitle>
            <DialogDescription>
              Share a great RSS feed with the community
            </DialogDescription>
          </DialogHeader>
        )}
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
