import { randomUUID } from 'crypto';
import { isIP } from 'net';
import { CheerioCrawler, RequestQueue } from 'crawlee';
import type { ScrapeResult } from './scraper.service';

// Bing commonly returns only 10 organic results even when `count=50` is
// requested. Using 50 here made every small Crawlee job stop at 10 leads
// because only one search page was discovered.
const RESULTS_PER_SEARCH_PAGE = 10;
const BLOCKED_HOSTS = [
  'bing.com',
  'google.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'youtube.com',
  'x.com',
  'twitter.com',
  'yelp.com',
  'yellowpages.com',
];

type JsonLdValue = Record<string, unknown>;

const cleanText = (value?: string | null) => value?.replace(/\s+/g, ' ').trim() || undefined;

const phoneFromLink = (href?: string): string | undefined => {
  if (!href) return undefined;
  const phone = href.replace(/^tel:/i, '');
  try {
    return decodeURIComponent(phone);
  } catch {
    return phone;
  }
};

const normalizeUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    url.hash = '';
    return url.toString();
  } catch {
    return undefined;
  }
};

// Bing wraps organic results in /ck/a links whose `u` parameter starts with
// "a1" followed by a base64url-encoded destination URL.
const resolveSearchResultUrl = (href?: string | null): string | undefined => {
  const url = normalizeUrl(href);
  if (!url) return undefined;

  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'bing.com' || parsed.pathname !== '/ck/a') return url;

  const encoded = parsed.searchParams.get('u');
  if (!encoded?.startsWith('a1')) return undefined;
  return normalizeUrl(Buffer.from(encoded.slice(2), 'base64url').toString('utf8'));
};

const isBusinessWebsite = (value: string): boolean => {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'localhost' || hostname.endsWith('.local') || isIP(hostname)) return false;
    return !BLOCKED_HOSTS.some((blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`));
  } catch {
    return false;
  }
};

const flattenJsonLd = (value: unknown): JsonLdValue[] => {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (!value || typeof value !== 'object') return [];

  const object = value as JsonLdValue;
  const graph = object['@graph'];
  return [object, ...(graph ? flattenJsonLd(graph) : [])];
};

const schemaTypes = (value: JsonLdValue): string[] => {
  const rawType = value['@type'];
  return (Array.isArray(rawType) ? rawType : [rawType])
    .filter((type): type is string => typeof type === 'string')
    .map((type) => type.toLowerCase());
};

const isBusinessSchema = (value: JsonLdValue): boolean => {
  const types = schemaTypes(value);
  return types.some((type) =>
    type === 'organization' ||
    type === 'localbusiness' ||
    type.endsWith('business') ||
    type.includes('store') ||
    type.includes('service')
  );
};

const stringifyAddress = (value: unknown): string | undefined => {
  if (typeof value === 'string') return cleanText(value);
  if (!value || typeof value !== 'object') return undefined;

  const address = value as Record<string, unknown>;
  return cleanText([
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    address.addressCountry,
  ].filter((part): part is string => typeof part === 'string').join(', '));
};

const parseJsonLd = (jsonLdScripts: string[]): JsonLdValue[] => {
  return jsonLdScripts.flatMap((script) => {
    try {
      return flattenJsonLd(JSON.parse(script));
    } catch {
      return [];
    }
  });
};

/**
 * Discovers public business websites with Bing and uses Crawlee to extract
 * business identity and contact details from the websites themselves.
 */
export const scrapeWithCrawlee = async (
  city: string,
  category: string,
  limit: number = 100
): Promise<ScrapeResult[]> => {
  const runId = randomUUID();
  const discoveryQueue = await RequestQueue.open(`lead-discovery-${runId}`);
  const websiteQueue = await RequestQueue.open(`lead-websites-${runId}`);
  const results: ScrapeResult[] = [];
  const queuedHosts = new Set<string>();
  const resultKeys = new Set<string>();
  const websiteUrls: string[] = [];
  const searchPageCount = Math.max(1, Math.ceil(limit / RESULTS_PER_SEARCH_PAGE));
  const searchUrls = Array.from({ length: searchPageCount }, (_, page) =>
    `https://www.bing.com/search?q=${encodeURIComponent(`${category} in ${city}`)}&count=${RESULTS_PER_SEARCH_PAGE}&first=${page * RESULTS_PER_SEARCH_PAGE + 1}`
  );

  try {
    const discoveryCrawler = new CheerioCrawler({
      requestQueue: discoveryQueue,
      maxConcurrency: 2,
      maxRequestRetries: 2,
      requestHandlerTimeoutSecs: 30,
      requestHandler: ({ $, log }) => {
        let pageCandidates = 0;

        $('#b_results li.b_algo h2 a[href], #b_results li.b_algo .b_title a[href]').each((_, element) => {
          const candidate = resolveSearchResultUrl($(element).attr('href'));
          if (!candidate || !isBusinessWebsite(candidate)) return;

          const hostname = new URL(candidate).hostname.toLowerCase().replace(/^www\./, '');
          if (queuedHosts.has(hostname) || queuedHosts.size >= limit * 2) return;
          queuedHosts.add(hostname);
          websiteUrls.push(candidate);
          pageCandidates++;
        });

        if (!pageCandidates) {
          log.warning('No candidate business websites were found on a search result page.');
        }
      },
    });

    await discoveryCrawler.run(searchUrls);
    console.info(`CRAWLEE: Searched ${searchUrls.length} pages; found ${websiteUrls.length} candidate websites.`);
    if (!websiteUrls.length) {
      throw new Error('Crawlee found no business websites in the search results. Check the search page or try another city/category.');
    }

    const websiteCrawler = new CheerioCrawler({
      requestQueue: websiteQueue,
      maxConcurrency: 8,
      maxRequestsPerCrawl: Math.max(limit * 2, 1),
      maxRequestRetries: 1,
      requestHandlerTimeoutSecs: 30,
      respectRobotsTxtFile: true,
      requestHandler: async ({ request, $, crawler }) => {
        if (results.length >= limit) {
          crawler.stop('Requested lead limit reached');
          return;
        }

        const schemas = parseJsonLd(
          $('script[type="application/ld+json"]').map((_, element) => $(element).html() || '').get()
        );
        const business = schemas.find(isBusinessSchema);
        const loadedUrl = normalizeUrl(request.loadedUrl || request.url) || request.url;
        const schemaUrl = typeof business?.url === 'string' ? normalizeUrl(business.url) : undefined;
        const name = cleanText(
          (typeof business?.name === 'string' ? business.name : undefined) ||
          $('meta[property="og:site_name"]').attr('content') ||
          $('title').first().text().split(/\s+[|—–-]\s+/)[0]
        );

        if (!name) return;

        const phone = cleanText(
          (typeof business?.telephone === 'string' ? business.telephone : undefined) ||
          phoneFromLink($('a[href^="tel:"]').first().attr('href')) ||
          $('body').text().match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]
        );
        const address = stringifyAddress(business?.address) || cleanText($('address').first().text());
        const website = schemaUrl || loadedUrl;
        const key = `${name.toLowerCase()}|${new URL(website).hostname.toLowerCase()}`;

        if (!resultKeys.has(key)) {
          resultKeys.add(key);
          results.push({ name, phone, address, website });
        }
      },
    });

    await websiteCrawler.run(websiteUrls);
    console.info(`CRAWLEE: Extracted ${results.length} leads from ${websiteUrls.length} candidate websites.`);
    if (!results.length) {
      throw new Error('Crawlee visited candidate websites but extracted no leads. Check crawler warnings for blocked or empty pages.');
    }
    return results.slice(0, limit);
  } finally {
    await Promise.allSettled([discoveryQueue.drop(), websiteQueue.drop()]);
  }
};
