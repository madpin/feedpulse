import Parser from 'rss-parser';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

// Default timeout for feed parsing (can be overridden)
const DEFAULT_TIMEOUT = 15000;

const parser = new Parser({
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'User-Agent': 'FeedPulse/1.0 (RSS Feed Aggregator)',
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  },
  customFields: {
    feed: [
      'image',
      'itunes:image',
      'itunes:author',
      'itunes:category',
      'itunes:explicit',
      'itunes:owner',
      'itunes:subtitle',
      'itunes:summary',
      'lastBuildDate',
      'pubDate',
      'ttl',
      'webMaster',
      'managingEditor',
      'copyright',
      'generator',
      'docs',
      'cloud',
      'sy:updatePeriod',
      'sy:updateFrequency',
    ] as const,
    item: [
      ['author', 'author'],
      ['dc:creator', 'creator'],
      ['dc:date', 'dcDate'],
      ['dc:subject', 'dcSubject'],
      ['category', 'categories'],
      ['enclosure', 'enclosure'],
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:group', 'mediaGroup'],
      ['media:description', 'mediaDescription'],
      ['itunes:duration', 'duration'],
      ['itunes:episode', 'episode'],
      ['itunes:season', 'season'],
      ['itunes:image', 'itunesImage'],
      ['itunes:summary', 'itunesSummary'],
      ['itunes:subtitle', 'itunesSubtitle'],
      ['itunes:author', 'itunesAuthor'],
      ['itunes:explicit', 'explicit'],
      ['comments', 'commentsUrl'],
      ['source', 'source'],
      ['georss:point', 'geoPoint'],
    ] as const,
  },
  // Do not limit the number of items - get all available
  maxRedirects: 5,
});

export interface ParsedFeed {
  title?: string;
  description?: string;
  link?: string;
  language?: string;
  imageUrl?: string;
  lastBuildDate?: string;
  pubDate?: string;
  copyright?: string;
  generator?: string;
  managingEditor?: string;
  webMaster?: string;
  ttl?: number;
  updatePeriod?: string;
  updateFrequency?: number;
  itunesAuthor?: string;
  itunesCategory?: string;
  itunesExplicit?: boolean;
  items: ParsedFeedItem[];
}

export interface ParsedFeedItem {
  guid: string;
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  isoDate?: string;
  author?: string;
  creator?: string;
  categories?: string[];
  enclosure?: {
    url?: string;
    type?: string;
    length?: string;
  };
  mediaUrl?: string;
  mediaThumbnail?: string;
  mediaType?: string;
  duration?: string;
  commentsUrl?: string;
  source?: string;
}

export async function parseFeed(url: string, timeoutMs: number = DEFAULT_TIMEOUT): Promise<ParsedFeed> {
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    // Use fetch with timeout, then parse the XML
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FeedPulse/1.0 (RSS Feed Aggregator)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xml = await response.text();
    const feed = await parser.parseString(xml);
  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feedAny = feed as any;
    
    // Extract image URL from various possible locations
    let imageUrl: string | undefined;
    
    // Try RSS image.url (array format from xml2js)
    if (feedAny.image?.url?.[0]) {
      imageUrl = feedAny.image.url[0];
    }
    // Try iTunes image href
    else if (feedAny['itunes:image']?.$?.href) {
      imageUrl = feedAny['itunes:image'].$.href;
    }
    // Try direct image URL
    else if (typeof feedAny.image === 'string') {
      imageUrl = feedAny.image;
    }
    // Try image object with url property
    else if (feedAny.image?.url) {
      imageUrl = feedAny.image.url;
    }
    
    // Extract update frequency info
    const updatePeriod = feedAny['sy:updatePeriod']?.[0] || feedAny['sy:updatePeriod'];
    const updateFrequency = feedAny['sy:updateFrequency']?.[0] || feedAny['sy:updateFrequency'];
    const ttl = feedAny.ttl?.[0] || feedAny.ttl;
    
    return {
      title: feed.title,
      description: feed.description,
      link: feed.link,
      language: feedAny.language,
      imageUrl,
      lastBuildDate: feedAny.lastBuildDate,
      pubDate: feedAny.pubDate,
      copyright: feedAny.copyright,
      generator: feedAny.generator,
      managingEditor: feedAny.managingEditor,
      webMaster: feedAny.webMaster,
      ttl: ttl ? parseInt(ttl, 10) : undefined,
      updatePeriod: typeof updatePeriod === 'string' ? updatePeriod : undefined,
      updateFrequency: updateFrequency ? parseInt(updateFrequency, 10) : undefined,
      itunesAuthor: feedAny['itunes:author'],
      itunesCategory: extractItunesCategory(feedAny['itunes:category']),
      itunesExplicit: feedAny['itunes:explicit'] === 'yes' || feedAny['itunes:explicit'] === 'true',
      items: feed.items.map(item => parseItem(item)),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout: Feed took longer than ${timeoutMs}ms to respond`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper to extract iTunes category
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractItunesCategory(category: any): string | undefined {
  if (!category) return undefined;
  if (typeof category === 'string') return category;
  if (category.$?.text) return category.$.text;
  if (Array.isArray(category) && category[0]?.$?.text) return category[0].$.text;
  return undefined;
}

// Helper to parse individual feed items with maximum metadata extraction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseItem(item: any): ParsedFeedItem {
  // Extract author from multiple possible sources
  const author = item.author || item.creator || item.itunesAuthor || item['dc:creator'];
  
  // Extract categories - can be string, array, or object
  let categories: string[] | undefined;
  if (item.categories && Array.isArray(item.categories)) {
    categories = item.categories.map((cat: string | { _: string }) => 
      typeof cat === 'string' ? cat : cat._
    ).filter(Boolean);
  } else if (item.category) {
    const cat = item.category;
    if (Array.isArray(cat)) {
      categories = cat.map((c: string | { _: string }) => typeof c === 'string' ? c : c._).filter(Boolean);
    } else if (typeof cat === 'string') {
      categories = [cat];
    }
  }
  
  // Extract enclosure (for podcasts, media)
  let enclosure: ParsedFeedItem['enclosure'];
  if (item.enclosure) {
    const enc = item.enclosure;
    enclosure = {
      url: enc.url || enc.$?.url,
      type: enc.type || enc.$?.type,
      length: enc.length || enc.$?.length,
    };
  }
  
  // Extract media URL from various sources
  let mediaUrl: string | undefined;
  let mediaThumbnail: string | undefined;
  let mediaType: string | undefined;
  
  // Try media:content
  if (item.mediaContent) {
    const media = Array.isArray(item.mediaContent) ? item.mediaContent[0] : item.mediaContent;
    mediaUrl = media.$?.url || media.url;
    mediaType = media.$?.type || media.type;
  }
  
  // Try media:thumbnail
  if (item.mediaThumbnail) {
    const thumb = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail[0] : item.mediaThumbnail;
    mediaThumbnail = thumb.$?.url || thumb.url || thumb;
  }
  
  // Try media:group
  if (!mediaUrl && item.mediaGroup) {
    const group = item.mediaGroup;
    if (group['media:content']) {
      const content = Array.isArray(group['media:content']) ? group['media:content'][0] : group['media:content'];
      mediaUrl = content.$?.url || content.url;
      mediaType = content.$?.type || content.type;
    }
    if (!mediaThumbnail && group['media:thumbnail']) {
      const thumb = Array.isArray(group['media:thumbnail']) ? group['media:thumbnail'][0] : group['media:thumbnail'];
      mediaThumbnail = thumb.$?.url || thumb.url;
    }
  }
  
  // Fallback to enclosure for media URL
  if (!mediaUrl && enclosure?.url) {
    mediaUrl = enclosure.url;
    mediaType = enclosure.type;
  }
  
  // Try iTunes image
  if (!mediaThumbnail && item.itunesImage) {
    mediaThumbnail = item.itunesImage.$?.href || item.itunesImage;
  }
  
  return {
    guid: item.guid || item.id || item.link || item.title || '',
    title: item.title,
    link: item.link,
    content: item.content || item['content:encoded'] || item.itunesSummary || item.description,
    contentSnippet: item.contentSnippet || item.itunesSubtitle,
    pubDate: item.pubDate,
    isoDate: item.isoDate || item.dcDate,
    author: typeof author === 'string' ? author : undefined,
    creator: item.creator || item['dc:creator'],
    categories,
    enclosure,
    mediaUrl,
    mediaThumbnail,
    mediaType,
    duration: item.duration,
    commentsUrl: item.commentsUrl || item.comments,
    source: item.source,
  };
}

export async function fetchFullContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FeedPulse/1.0 (RSS Feed Aggregator)',
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    return article?.textContent || null;
  } catch (error) {
    console.error(`Failed to fetch full content from ${url}:`, error);
    return null;
  }
}

export function calculatePostingFrequency(items: ParsedFeedItem[]): {
  frequency: string;
  postsPerWeek: number;
} {
  if (items.length < 2) {
    return { frequency: 'irregular', postsPerWeek: 0 };
  }
  
  // Get dates of posts
  const dates = items
    .map(item => item.isoDate ? new Date(item.isoDate) : null)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime());
  
  if (dates.length < 2) {
    return { frequency: 'irregular', postsPerWeek: 0 };
  }
  
  // Calculate average time between posts
  const intervals: number[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    intervals.push(dates[i].getTime() - dates[i + 1].getTime());
  }
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const avgIntervalHours = avgInterval / (1000 * 60 * 60);
  const avgIntervalDays = avgIntervalHours / 24;
  
  // Calculate posts per week
  const postsPerWeek = Math.round((7 / avgIntervalDays) * 100) / 100;
  
  // Determine frequency category
  let frequency: string;
  if (avgIntervalHours < 6) {
    frequency = 'hourly';
  } else if (avgIntervalDays < 2) {
    frequency = 'daily';
  } else if (avgIntervalDays < 10) {
    frequency = 'weekly';
  } else if (avgIntervalDays < 45) {
    frequency = 'monthly';
  } else {
    frequency = 'irregular';
  }
  
  return { frequency, postsPerWeek };
}
