/**
 * MND — Server-side RSS feed fetcher and parser.
 * Uses rss-parser to fetch and normalize articles from Google News and
 * Indian news outlet RSS feeds.
 */

import Parser from 'rss-parser';

// Configure rss-parser with custom fields for media content
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content', { keepArray: true }],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
      ['source', 'source'],
      ['content:encoded', 'content:encoded'],
    ],
  },
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MND-NewsAggregator/1.0',
    Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
});

/**
 * Extract the best available image URL from an RSS item.
 */
function extractImage(item) {
  // 1. media:content
  if (item['media:content']) {
    const media = Array.isArray(item['media:content'])
      ? item['media:content'][0]
      : item['media:content'];
    if (media?.$?.url) return media.$.url;
  }

  // 2. media:thumbnail
  if (item['media:thumbnail']?.$?.url) {
    return item['media:thumbnail'].$.url;
  }

  // 3. enclosure (image type)
  if (item.enclosure?.url) {
    const type = item.enclosure.type || '';
    if (!type || type.startsWith('image/')) {
      return item.enclosure.url;
    }
  }

  // 4. Parse <img> from description or content:encoded
  const rawHtml = item['content:encoded'] || item.content || item.description || '';
  const imgMatch = rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Normalize text by replacing problematic Unicode characters with clean ASCII.
 * Fixes mojibake from curly quotes, em-dashes, etc.
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    // Curly/smart quotes → straight quotes
    .replace(/[\u2018\u2019\u201A\u2032\u0060]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    // Dashes
    .replace(/[\u2013\u2014\u2015]/g, ' — ')
    .replace(/[\u2010\u2011\u2012]/g, '-')
    // Ellipsis
    .replace(/\u2026/g, '...')
    // Spaces
    .replace(/[\u00A0\u2002\u2003\u2009]/g, ' ')
    // Bullet
    .replace(/\u2022/g, '-')
    // Clean up any remaining control characters
    .replace(/[\u0000-\u001F\u007F]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strip HTML tags from text to produce plain text.
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, ' — ')
    .replace(/&ndash;/g, ' – ')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch and parse a single RSS feed URL.
 * Returns an array of normalized article objects.
 */
export async function fetchAndParseRss(feedUrl, fallbackSourceName = 'News') {
  const feed = await parser.parseURL(feedUrl);

  return (feed.items || []).map((item) => {
    // Extract source name
    let sourceName = fallbackSourceName;
    if (item.source) {
      if (typeof item.source === 'string') {
        sourceName = item.source;
      } else if (typeof item.source === 'object') {
        sourceName = item.source._ || item.source.name || fallbackSourceName;
      }
    } else if (item.creator) {
      sourceName = item.creator;
    }

    // Clean title — remove trailing " - Source Name" if present
    let title = item.title || 'Untitled';
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      // Check if the last part looks like a source name (short text)
      const lastPart = parts[parts.length - 1].trim();
      if (lastPart.length < 40) {
        if (sourceName === fallbackSourceName) {
          sourceName = lastPart;
        }
        title = parts.slice(0, -1).join(' - ').trim();
      }
    }

    // Get summary — try multiple sources for a real snippet
    let snippet = '';

    // 1. Prefer contentSnippet (already plain text from rss-parser)
    if (item.contentSnippet && item.contentSnippet.trim().length > 20) {
      snippet = item.contentSnippet.trim();
    }

    // 2. Try description (may contain HTML)
    if (!snippet || snippet.length < 20) {
      const descText = stripHtml(item.description || '');
      if (descText.length > 20) {
        snippet = descText;
      }
    }

    // 3. Try content:encoded (longer HTML content)
    if (!snippet || snippet.length < 20) {
      const encodedText = stripHtml(item['content:encoded'] || '');
      if (encodedText.length > 20) {
        snippet = encodedText;
      }
    }

    // 4. Try summary field
    if (!snippet || snippet.length < 20) {
      const summaryText = stripHtml(item.summary || '');
      if (summaryText.length > 20) {
        snippet = summaryText;
      }
    }

    // Clean up Google News-style snippet suffixes
    snippet = snippet
      .replace(/See more headlines and perspectives on Google News$/i, '')
      .replace(/View Full Coverage on Google News$/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 5. If still empty or too short, generate a clean contextual placeholder
    if (!snippet || snippet.length < 15) {
      snippet = `Tap to read the full story about: ${title}.`;
    }

    // Normalize encoding issues in title and snippet
    title = normalizeText(title);
    snippet = normalizeText(snippet);

    // Truncate snippet to reasonable length
    if (snippet.length > 300) {
      snippet = snippet.substring(0, 297) + '...';
    }

    return {
      id: item.guid || item.link || `${Date.now()}-${Math.random()}`,
      title,
      link: item.link || '',
      pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
      source: sourceName,
      snippet,
      imageUrl: extractImage(item),
    };
  });
}

// ─── In-memory cache ────────────────────────────────────────────────────────

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

/**
 * Fetch RSS with caching. Returns cached result if within TTL.
 */
export async function fetchRssCached(feedUrl, fallbackSourceName = 'News') {
  const cacheKey = feedUrl;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchAndParseRss(feedUrl, fallbackSourceName);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

// ─── og:image enrichment ────────────────────────────────────────────────────

const ogImageCache = new Map();
const OG_IMAGE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch og:image from a URL's HTML meta tags.
 * Used to fill in missing images from Google News articles.
 * Returns an image URL string or null.
 */
async function fetchOgImage(url) {
  if (!url) return null;

  // Check cache
  const cached = ogImageCache.get(url);
  if (cached && Date.now() - cached.timestamp < OG_IMAGE_CACHE_TTL) {
    return cached.imageUrl;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      ogImageCache.set(url, { imageUrl: null, timestamp: Date.now() });
      return null;
    }

    const html = await res.text();

    // Try og:image, then twitter:image
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

    const imageUrl = match ? match[1] : null;
    ogImageCache.set(url, { imageUrl, timestamp: Date.now() });
    return imageUrl;
  } catch {
    ogImageCache.set(url, { imageUrl: null, timestamp: Date.now() });
    return null;
  }
}

/**
 * Enrich articles that have no imageUrl by extracting og:image
 * from their link URLs. Processes all missing-image articles in parallel.
 *
 * Mutates the articles array in place for efficiency.
 */
export async function enrichArticleImages(articles) {
  const needsImage = articles.filter((a) => !a.imageUrl);
  if (needsImage.length === 0) return articles;

  await Promise.allSettled(
    needsImage.map(async (article) => {
      const ogImage = await fetchOgImage(article.link);
      if (ogImage) {
        article.imageUrl = ogImage;
      }
    })
  );

  return articles;
}
