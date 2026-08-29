/**
 * MND — API route for fetching news.
 * GET /api/news?category=sports&state=all
 *
 * Fetches from Google News RSS and Indian publisher feeds,
 * deduplicates, sorts by date, enriches missing images via og:image,
 * and returns normalized articles.
 */

import { NextResponse } from 'next/server';
import { fetchRssCached, enrichArticleImages } from '@/lib/rss';
import { CATEGORY_KEYWORDS, MAX_ARTICLES_PER_CATEGORY } from '@/lib/constants';

// ─── Google News URL builders ────────────────────────────────────────────────

function buildGoogleNewsUrl(query) {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}+when:7d&hl=en-IN&gl=IN&ceid=IN:en`;
}

function buildGoogleNewsGeoUrl(state) {
  const encoded = encodeURIComponent(state);
  return `https://news.google.com/rss/headlines/section/geo/${encoded}?hl=en-IN&gl=IN&ceid=IN:en`;
}

// ─── State-specific publisher feeds ──────────────────────────────────────────
// Dedicated RSS feeds from The Hindu and Indian Express for major states.
// These return general news (all categories) and will be filtered by keywords.

const STATE_PUBLISHER_FEEDS = {
  'Telangana': [
    { url: 'https://www.thehindu.com/news/national/telangana/feeder/default.rss', source: 'The Hindu' },
    { url: 'https://indianexpress.com/section/cities/hyderabad/feed/', source: 'Indian Express' },
  ],
  'Andhra Pradesh': [
    { url: 'https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss', source: 'The Hindu' },
  ],
  'Karnataka': [
    { url: 'https://www.thehindu.com/news/national/karnataka/feeder/default.rss', source: 'The Hindu' },
    { url: 'https://indianexpress.com/section/cities/bangalore/feed/', source: 'Indian Express' },
  ],
  'Tamil Nadu': [
    { url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', source: 'The Hindu' },
    { url: 'https://indianexpress.com/section/cities/chennai/feed/', source: 'Indian Express' },
  ],
  'Kerala': [
    { url: 'https://www.thehindu.com/news/national/kerala/feeder/default.rss', source: 'The Hindu' },
  ],
  'Maharashtra': [
    { url: 'https://indianexpress.com/section/cities/mumbai/feed/', source: 'Indian Express' },
    { url: 'https://indianexpress.com/section/cities/pune/feed/', source: 'Indian Express' },
  ],
  'Delhi': [
    { url: 'https://www.thehindu.com/news/cities/Delhi/feeder/default.rss', source: 'The Hindu' },
    { url: 'https://indianexpress.com/section/cities/delhi/feed/', source: 'Indian Express' },
  ],
  'West Bengal': [
    { url: 'https://www.thehindu.com/news/cities/kolkata/feeder/default.rss', source: 'The Hindu' },
    { url: 'https://indianexpress.com/section/cities/kolkata/feed/', source: 'Indian Express' },
  ],
  'Uttar Pradesh': [
    { url: 'https://indianexpress.com/section/cities/lucknow/feed/', source: 'Indian Express' },
  ],
  'Gujarat': [
    { url: 'https://indianexpress.com/section/cities/ahmedabad/feed/', source: 'Indian Express' },
  ],
  'Rajasthan': [
    { url: 'https://indianexpress.com/section/cities/jaipur/feed/', source: 'Indian Express' },
  ],
  'Punjab': [
    { url: 'https://indianexpress.com/section/cities/chandigarh/feed/', source: 'Indian Express' },
  ],
  'Chandigarh': [
    { url: 'https://indianexpress.com/section/cities/chandigarh/feed/', source: 'Indian Express' },
  ],
  'Haryana': [
    { url: 'https://indianexpress.com/section/cities/chandigarh/feed/', source: 'Indian Express' },
  ],
  'Bihar': [
    { url: 'https://indianexpress.com/section/cities/patna/feed/', source: 'Indian Express' },
  ],
  'Jharkhand': [
    { url: 'https://indianexpress.com/section/cities/ranchi/feed/', source: 'Indian Express' },
  ],
};

// ─── Category keyword filters ────────────────────────────────────────────────
// Used to filter general state feeds by category relevance.

const CATEGORY_FILTER_KEYWORDS = {
  sports: [
    'sport', 'cricket', 'ipl', 'football', 'hockey', 'tennis', 'badminton',
    'wrestling', 'kabaddi', 'athlete', 'match', 'tournament', 'championship',
    'olympics', 'medal', 'team india', 'player', 'coach', 'stadium', 'league',
    'bcci', 'isl', 'pro kabaddi', 'ranji', 'duleep',
  ],
  education: [
    'education', 'school', 'university', 'exam', 'student', 'college',
    'board result', 'cbse', 'neet', 'jee', 'teacher', 'academic',
    'scholarship', 'admission', 'curriculum', 'syllabus', 'marksheet',
    'convocation', 'ugc', 'iit', 'nit', 'aiims',
  ],
  technology: [
    'technology', 'tech', 'artificial intelligence', ' ai ', 'startup',
    'digital', 'software', 'app', 'internet', 'cyber', ' it ',
    'data', 'innovation', 'robot', 'smartphone', 'computer',
    '5g', 'chip', 'semiconductor', 'gadget', 'isro', 'space',
  ],
  politics: [
    'politic', 'government', 'minister', 'parliament', 'election',
    'bjp', 'congress', 'party', 'chief minister', ' cm ', 'mla',
    ' mp ', 'vote', 'legislation', 'bill', 'policy', 'foreign',
    'diplomacy', 'modi', 'opposition', 'assembly', 'cabinet',
    'lok sabha', 'rajya sabha', 'governor',
  ],
};

/**
 * Filter articles from a general feed to keep only those matching a category.
 */
function filterByCategory(articles, category) {
  const keywords = CATEGORY_FILTER_KEYWORDS[category];
  if (!keywords || keywords.length === 0) return articles;

  return articles.filter((article) => {
    const text = ` ${article.title} ${article.snippet} `.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });
}

// ─── Feed URL resolution ─────────────────────────────────────────────────────

/**
 * Get feed URLs for a specific category and state combination.
 *
 * Returns an array of feed configs. Each has:
 *   { url, source, general }
 * where `general: true` means the feed returns all categories and results
 * should be filtered by keyword before merging.
 */
function getFeedUrls(category, state) {
  const isNational = !state || state === 'all';
  const keywords = CATEGORY_KEYWORDS[category] || category;
  const feeds = [];

  if (isNational) {
    // National-level: Google News topic + Indian publisher category feeds
    // These are already category-specific, no filtering needed.
    switch (category) {
      case 'sports':
        feeds.push(
          { url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', general: false },
          { url: 'https://indianexpress.com/section/sports/feed/', source: 'Indian Express', general: false },
          { url: 'https://www.thehindu.com/sport/feeder/default.rss', source: 'The Hindu', general: false },
          { url: 'https://feeds.feedburner.com/ndtvsports-latest', source: 'NDTV Sports', general: false }
        );
        break;
      case 'education':
        feeds.push(
          { url: buildGoogleNewsUrl('India education exam board university CBSE NEET JEE'), source: 'Google News', general: false },
          { url: 'https://indianexpress.com/section/education/feed/', source: 'Indian Express', general: false },
          { url: 'https://www.thehindu.com/education/feeder/default.rss', source: 'The Hindu', general: false }
        );
        break;
      case 'technology':
        feeds.push(
          { url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', general: false },
          { url: 'https://indianexpress.com/section/technology/feed/', source: 'Indian Express', general: false },
          { url: 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss', source: 'The Hindu', general: false },
          { url: 'https://feeds.feedburner.com/gadgets360-latest', source: 'NDTV Gadgets', general: false }
        );
        break;
      case 'politics':
        feeds.push(
          { url: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', general: false },
          { url: 'https://indianexpress.com/section/india/feed/', source: 'Indian Express', general: false },
          { url: 'https://www.thehindu.com/news/national/feeder/default.rss', source: 'The Hindu', general: false },
          { url: 'https://feeds.feedburner.com/ndtvnews-india-news', source: 'NDTV', general: false }
        );
        break;
      default:
        feeds.push(
          { url: buildGoogleNewsUrl(`India ${keywords}`), source: 'Google News', general: false }
        );
    }
  } else {
    // State-specific:
    // 1. Google News category+state search (targeted by query keywords)
    feeds.push({
      url: buildGoogleNewsUrl(`${state} ${keywords}`),
      source: 'Google News',
      general: false,
    });

    // 2. State publisher feeds (general — will be filtered by category keywords)
    const publisherFeeds = STATE_PUBLISHER_FEEDS[state];
    if (publisherFeeds && publisherFeeds.length > 0) {
      publisherFeeds.forEach((f) =>
        feeds.push({ url: f.url, source: f.source, general: true })
      );
    }

    // 3. Google News geo feed as additional general source
    feeds.push({
      url: buildGoogleNewsGeoUrl(state),
      source: `${state} News`,
      general: true,
    });
  }

  return feeds;
}

// ─── Deduplication ───────────────────────────────────────────────────────────

function deduplicateArticles(articles) {
  const seen = new Set();
  return articles.filter((article) => {
    const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (key.length < 5) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── GET handler ─────────────────────────────────────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get('category') || '').toLowerCase();
  const state = searchParams.get('state') || 'all';

  // Validate category
  const validCategories = ['sports', 'education', 'technology', 'politics'];
  if (!category || !validCategories.includes(category)) {
    return NextResponse.json(
      { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const feedConfigs = getFeedUrls(category, state);

    // Fetch all feeds in parallel with error resilience
    const results = await Promise.allSettled(
      feedConfigs.map(({ url, source }) =>
        fetchRssCached(url, source).catch((err) => {
          console.warn(`Failed to fetch ${source} (${url}):`, err.message);
          return [];
        })
      )
    );

    // Collect articles — apply category filter to general feeds
    let allArticles = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        let articles = result.value;
        if (feedConfigs[index].general) {
          articles = filterByCategory(articles, category);
        }
        allArticles.push(...articles);
      }
    });

    // Deduplicate
    allArticles = deduplicateArticles(allArticles);

    // Sort: prioritize articles WITH images, then by date (newest first)
    allArticles.sort((a, b) => {
      // Articles with images come first
      const hasImageA = a.imageUrl ? 1 : 0;
      const hasImageB = b.imageUrl ? 1 : 0;
      if (hasImageA !== hasImageB) return hasImageB - hasImageA;

      // Then by date
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateB - dateA;
    });

    // Limit to max articles per category
    const limited = allArticles.slice(0, MAX_ARTICLES_PER_CATEGORY);

    // Enrich any remaining articles that have no image via og:image extraction
    await enrichArticleImages(limited);

    return NextResponse.json({
      success: true,
      category,
      state,
      count: limited.length,
      articles: limited,
    });
  } catch (error) {
    console.error(`[MND API] Error fetching ${category} news for ${state}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news. Please try again later.' },
      { status: 500 }
    );
  }
}
