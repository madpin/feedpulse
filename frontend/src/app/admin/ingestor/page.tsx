'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Upload,
  ExternalLink,
  Rss,
  Globe,
  Clock,
  Hash,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';

type ValidationResult = {
  url: string;
  isValid: boolean;
  exists: boolean;
  existingFeedId?: string;
  feedInfo?: {
    title?: string;
    description?: string;
    siteUrl?: string;
    imageUrl?: string;
    language?: string;
    postingFrequency?: string;
    postsPerWeek?: number;
    itemCount?: number;
  };
  error?: string;
  selected?: boolean;
};

type ImportResult = {
  url: string;
  success: boolean;
  feedId?: string;
  error?: string;
};

export default function IngestorPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // Step state
  const [step, setStep] = useState<'input' | 'extract' | 'validate' | 'import' | 'done'>('input');
  
  // Input state
  const [inputText, setInputText] = useState('');
  
  // Extract state
  const [extractedUrls, setExtractedUrls] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Validation state
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState<{ current: number; total: number } | null>(null);
  const [validationStats, setValidationStats] = useState<{
    total: number;
    valid: number;
    existing: number;
    invalid: number;
  } | null>(null);
  
  // Import state
  const [autoApprove, setAutoApprove] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importStats, setImportStats] = useState<{
    imported: number;
    failed: number;
    total: number;
  } | null>(null);

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="container px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExtract = async () => {
    if (!inputText.trim()) return;
    
    setIsExtracting(true);
    try {
      const result = await adminApi.ingestorExtract(inputText);
      setExtractedUrls(result.urls);
      if (result.urls.length > 0) {
        setStep('extract');
      }
    } catch (err) {
      console.error('Extract failed:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleValidate = async () => {
    if (extractedUrls.length === 0) return;
    
    setIsValidating(true);
    setValidationProgress({ current: 0, total: extractedUrls.length });
    setValidationResults([]);
    try {
      const result = await adminApi.ingestorValidate(
        extractedUrls,
        // Progress callback - real-time updates from server
        (current, total) => {
          setValidationProgress({ current, total });
        },
        // Result callback - each result as it comes in
        (singleResult) => {
          setValidationResults(prev => [...prev, { ...singleResult, selected: singleResult.isValid && !singleResult.exists }]);
        }
      );
      // Final update with complete results
      setValidationResults(result.results.map(r => ({ ...r, selected: r.isValid && !r.exists })));
      setValidationStats({
        total: result.total,
        valid: result.valid,
        existing: result.existing,
        invalid: result.invalid,
      });
      setStep('validate');
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setIsValidating(false);
      setValidationProgress(null);
    }
  };

  const handleToggleSelect = (url: string) => {
    setValidationResults(prev => 
      prev.map(r => r.url === url ? { ...r, selected: !r.selected } : r)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setValidationResults(prev => 
      prev.map(r => (r.isValid && !r.exists) ? { ...r, selected } : r)
    );
  };

  const handleImport = async () => {
    const selectedUrls = validationResults
      .filter(r => r.selected && r.isValid && !r.exists)
      .map(r => r.url);
    
    if (selectedUrls.length === 0) return;
    
    setIsImporting(true);
    setImportProgress({ current: 0, total: selectedUrls.length });
    setImportResults([]);
    try {
      const result = await adminApi.ingestorImport(
        selectedUrls,
        autoApprove,
        // Progress callback - real-time updates from server
        (current, total) => {
          setImportProgress({ current, total });
        },
        // Result callback - each result as it comes in
        (singleResult) => {
          setImportResults(prev => [...prev, singleResult]);
        }
      );
      // Final update with complete results
      setImportResults(result.results);
      setImportStats({
        imported: result.imported,
        failed: result.failed,
        total: result.total,
      });
      setStep('done');
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const handleReset = () => {
    setStep('input');
    setInputText('');
    setExtractedUrls([]);
    setValidationResults([]);
    setValidationStats(null);
    setValidationProgress(null);
    setImportResults([]);
    setImportStats(null);
    setImportProgress(null);
  };

  const selectedCount = validationResults.filter(r => r.selected).length;
  const validNewCount = validationResults.filter(r => r.isValid && !r.exists).length;

  return (
    <div className="container px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Feed Ingestor
          </h1>
          <p className="text-muted-foreground">
            Extract and import RSS feeds from text content
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['input', 'extract', 'validate', 'done'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step === s || ['input', 'extract', 'validate', 'done'].indexOf(step) > i
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'}
            `}>
              {i + 1}
            </div>
            {i < 3 && (
              <div className={`w-12 h-0.5 mx-1 ${
                ['input', 'extract', 'validate', 'done'].indexOf(step) > i
                  ? 'bg-primary'
                  : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Input Text */}
      {step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Step 1: Paste Your Text
            </CardTitle>
            <CardDescription>
              Paste any text containing URLs. The system will automatically extract all URLs and validate them as RSS/Atom feeds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your text here... It can be an article, email, document, or any text containing feed URLs.

Example:
Check out these great tech blogs:
- https://example.com/feed.xml
- https://blog.example.org/rss
The feeds are updated daily with great content."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {inputText.length} characters
              </p>
              <Button 
                onClick={handleExtract} 
                disabled={isExtracting || !inputText.trim()}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Extract URLs
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review Extracted URLs */}
      {step === 'extract' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Step 2: Review Extracted URLs
            </CardTitle>
            <CardDescription>
              Found {extractedUrls.length} URL{extractedUrls.length !== 1 ? 's' : ''} in your text. Click validate to check which ones are valid RSS/Atom feeds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Validation Progress */}
            {isValidating && validationProgress && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Validating feeds...
                  </span>
                  <span className="text-muted-foreground">
                    {validationProgress.current} / {validationProgress.total}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(validationProgress.current / validationProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Checking each URL for valid RSS/Atom feed content...
                </p>
              </div>
            )}

            <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
              {extractedUrls.map((url, idx) => (
                <div key={idx} className="p-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <code className="text-sm break-all flex-1">{url}</code>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </a>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('input')} disabled={isValidating}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleValidate} disabled={isValidating}>
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating {validationProgress ? `(${validationProgress.current}/${validationProgress.total})` : '...'}
                  </>
                ) : (
                  <>
                    <Rss className="h-4 w-4 mr-2" />
                    Validate as Feeds
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Validation Results */}
      {step === 'validate' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Step 3: Select Feeds to Import
            </CardTitle>
            <CardDescription>
              Select which valid feeds you want to import. Existing and invalid feeds cannot be selected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            {validationStats && (
              <div className="flex gap-4 text-sm">
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {validationStats.valid} valid
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationStats.existing} existing
                </Badge>
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {validationStats.invalid} invalid
                </Badge>
              </div>
            )}

            {/* Select All */}
            {validNewCount > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedCount === validNewCount}
                  onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                />
                <Label htmlFor="select-all" className="text-sm cursor-pointer">
                  Select all valid feeds ({validNewCount})
                </Label>
              </div>
            )}

            <Separator />

            {/* Results List */}
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {validationResults.map((result, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 ${
                    result.isValid && !result.exists 
                      ? 'hover:bg-muted/50 cursor-pointer' 
                      : 'opacity-60'
                  }`}
                  onClick={() => result.isValid && !result.exists && handleToggleSelect(result.url)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox or Status Icon */}
                    {result.isValid && !result.exists ? (
                      <Checkbox
                        checked={result.selected}
                        onCheckedChange={() => handleToggleSelect(result.url)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                    ) : result.exists ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {/* URL */}
                      <code className="text-xs break-all text-muted-foreground">{result.url}</code>
                      
                      {/* Feed Info */}
                      {result.feedInfo && (
                        <div className="mt-2">
                          <p className="font-medium">{result.feedInfo.title || 'Untitled Feed'}</p>
                          {result.feedInfo.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {result.feedInfo.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {result.feedInfo.language && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {result.feedInfo.language}
                              </span>
                            )}
                            {result.feedInfo.postingFrequency && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {result.feedInfo.postingFrequency}
                              </span>
                            )}
                            {result.feedInfo.itemCount !== undefined && (
                              <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {result.feedInfo.itemCount} items
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Status badges */}
                      {result.exists && (
                        <div className="mt-2">
                          <Badge variant="secondary">Already exists</Badge>
                          {result.existingFeedId && (
                            <Link 
                              href={`/feed/${result.existingFeedId}`}
                              className="text-xs text-primary hover:underline ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View feed →
                            </Link>
                          )}
                        </div>
                      )}
                      
                      {/* Error */}
                      {result.error && (
                        <p className="text-xs text-destructive mt-2">{result.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Import Progress */}
            {isImporting && importProgress && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Importing feeds...
                  </span>
                  <span className="text-muted-foreground">
                    {importProgress.current} / {importProgress.total}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Creating feed entries and fetching initial content...
                </p>
              </div>
            )}

            {/* Auto-approve option */}
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="auto-approve"
                checked={autoApprove}
                onCheckedChange={(checked: boolean) => setAutoApprove(checked)}
                disabled={isImporting}
              />
              <Label htmlFor="auto-approve" className="text-sm cursor-pointer">
                Auto-approve imported feeds (skip pending review)
              </Label>
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('extract')} disabled={isImporting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || selectedCount === 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing {importProgress ? `(${importProgress.current}/${importProgress.total})` : '...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {selectedCount} Feed{selectedCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Import Results */}
      {step === 'done' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Import Complete
            </CardTitle>
            <CardDescription>
              Your feeds have been processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            {importStats && (
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  ✓ {importStats.imported} imported
                </span>
                {importStats.failed > 0 && (
                  <span className="text-red-600 font-medium">
                    ✗ {importStats.failed} failed
                  </span>
                )}
                <span className="text-muted-foreground">
                  of {importStats.total} total
                </span>
              </div>
            )}

            {/* Results List */}
            <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
              {importResults.map((result, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 text-sm ${
                    result.success 
                      ? 'bg-green-50 dark:bg-green-950/20' 
                      : 'bg-red-50 dark:bg-red-950/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <code className="text-xs break-all">{result.url}</code>
                      {result.error && (
                        <p className="text-xs text-red-600 mt-1">{result.error}</p>
                      )}
                      {result.feedId && (
                        <Link 
                          href={`/feed/${result.feedId}`}
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          View feed →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                <FileText className="h-4 w-4 mr-2" />
                Start New Import
              </Button>
              <Link href="/admin">
                <Button>
                  Back to Admin Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
