/**
 * Shared URL extraction utilities.
 * Extracted from routes/products.js so they can be reused by the compare endpoint.
 */

const https = require('https');
const http = require('http');

// ─── Browser-like headers ──────────────────────────────────────────────────
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

// ─── Short-link domains ────────────────────────────────────────────────────
const SHORT_DOMAINS = new Set([
  'amzn.in', 'amzn.to', 'amzn.com', 'a.co',
  'fkrt.cc', 'fkrt.it',
  'bit.ly', 'tinyurl.com', 'rb.gy', 't.co',
  'ow.ly', 'is.gd', 'buff.ly', 'goo.gl', 'shorturl.at',
  'cutt.ly', 'rebrand.ly',
]);

function isShortOrRedirectUrl(hostname) {
  const h = hostname.replace(/^www\./, '').toLowerCase();
  return SHORT_DOMAINS.has(h);
}

// ─── Redirect resolver ─────────────────────────────────────────────────────
function resolveShortUrl(url, maxRedirects = 10) {
  return new Promise((resolve) => {
    let current = url;
    let remaining = maxRedirects;

    function follow(u) {
      if (remaining <= 0) return resolve(current);
      remaining--;

      let parsedUrl;
      try { parsedUrl = new URL(u); } catch { return resolve(current); }

      const lib = parsedUrl.protocol === 'https:' ? https : http;

      const req = lib.request(
        {
          method: 'GET',
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || undefined,
          path: parsedUrl.pathname + parsedUrl.search,
          headers: { ...BROWSER_HEADERS, Host: parsedUrl.hostname },
        },
        (res) => {
          res.resume();
          const loc = res.headers['location'];
          if (loc && res.statusCode >= 300 && res.statusCode < 400) {
            current = loc.startsWith('http') ? loc : new URL(loc, u).href;
            follow(current);
          } else {
            resolve(current);
          }
        }
      );
      req.setTimeout(8000, () => { req.destroy(); resolve(current); });
      req.on('error', () => resolve(current));
      req.end();
    }

    follow(current);
  });
}

// ─── Platform detection ─────────────────────────────────────────────────────
function detectPlatform(hostname) {
  const h = hostname.replace(/^(www\.|m\.|smile\.|dl\.)/, '').toLowerCase();
  if (h === 'amazon.in' || h === 'amazon.com') return 'Amazon';
  if (h === 'flipkart.com') return 'Flipkart';
  if (h === 'amzn.in' || h === 'amzn.to' || h === 'amzn.com' || h === 'a.co') return 'Amazon';
  if (h === 'fkrt.cc' || h === 'fkrt.it') return 'Flipkart';
  return null;
}

// ─── URL normalisation ─────────────────────────────────────────────────────
function normalizeProductUrl(parsedUrl) {
  const keepParams = new Set(['pid', 'q', 'title']);
  const cleaned = new URL(parsedUrl.href);
  for (const key of [...cleaned.searchParams.keys()]) {
    if (!keepParams.has(key)) cleaned.searchParams.delete(key);
  }
  return cleaned;
}

function normalizePath(pathname, platform) {
  let p = pathname;
  if (platform === 'Flipkart') {
    p = p.replace(/^\/dl\//, '/');
  }
  return p;
}

// ─── Amazon title extraction ────────────────────────────────────────────────
const AMAZON_RE = /\/(?:([^/]+)\/)?(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i;
const AMAZON_SHARE_RE = /\/d\/([A-Za-z0-9_-]+)/;

function extractAmazonTitle(parsed) {
  const m = parsed.pathname.match(AMAZON_RE);
  if (m) {
    const slug = m[1];
    if (slug && slug !== '-') {
      const titleWords = slug
        .split('-')
        .map(w => decodeURIComponent(w).replace(/[_+]/g, ' ').trim())
        .filter(w => w.length > 0 && !/^(dp|gp|ref|sspa|s)$/i.test(w));
      if (titleWords.length > 0) return titleWords.join(' ');
    }
    return m[2]; // ASIN fallback
  }
  const shareMatch = parsed.pathname.match(AMAZON_SHARE_RE);
  if (shareMatch) return null;
  return null;
}

// ─── Flipkart title extraction ──────────────────────────────────────────────
const FLIPKART_RE = /\/([^/]+)\/p\/([^/?#]*)/i;

function extractFlipkartTitle(parsed, normalizedPath) {
  const pathToUse = normalizedPath || parsed.pathname;
  const m = pathToUse.match(FLIPKART_RE);
  if (m) {
    const slug = m[1];
    if (slug && slug !== 'p' && slug !== 'dl') {
      const words = slug
        .split('-')
        .map(w => decodeURIComponent(w).replace(/[_+]/g, ' ').trim())
        .filter(w => w.length > 0);
      if (words.length > 0) return words.join(' ');
    }
  }
  const qParam = parsed.searchParams.get('q') || parsed.searchParams.get('title');
  if (qParam) return qParam;
  const nameParam = parsed.searchParams.get('name');
  if (nameParam) return nameParam.replace(/-/g, ' ');
  return null;
}

// ─── Slug cleanup ───────────────────────────────────────────────────────────
function slugToReadable(title) {
  if (!title) return title;
  return title
    .replace(/\b(dp|gp|ref|pid|lid|marketplace|store|srno|otracker|iid|ssid|affid|dl|www|http|https)\b/gi, '')
    .replace(/[%]20/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Master helper: Given a raw user input, detect if it's a URL,
 * resolve short links, extract product name.
 * Returns { isUrl, productName, platform, resolvedUrl } or throws on bad URL.
 */
async function extractProductName(input) {
  const trimmed = input.trim();

  // Plain text — not a URL
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { isUrl: false, productName: trimmed, platform: null, resolvedUrl: null };
  }

  // It's a URL
  let parsed;
  try { parsed = new URL(trimmed); } catch {
    throw new Error('Invalid URL format');
  }

  // Resolve redirects if needed
  let resolvedUrl = trimmed;
  if (isShortOrRedirectUrl(parsed.hostname) || !detectPlatform(parsed.hostname)) {
    resolvedUrl = await resolveShortUrl(trimmed);
    try { parsed = new URL(resolvedUrl); } catch { /* keep original */ }
  }

  parsed = normalizeProductUrl(parsed);
  const platform = detectPlatform(parsed.hostname);

  if (!platform) {
    // Not Amazon/Flipkart — treat the full URL path as a search query (best effort)
    return { isUrl: true, productName: trimmed, platform: null, resolvedUrl };
  }

  const normalizedPath = normalizePath(parsed.pathname, platform);
  let rawTitle = null;

  if (platform === 'Amazon') {
    rawTitle = extractAmazonTitle(parsed);
  } else {
    rawTitle = extractFlipkartTitle(parsed, normalizedPath);
  }

  const productName = rawTitle ? slugToReadable(rawTitle) : null;

  if (!productName) {
    throw new Error('Unable to extract product name from URL');
  }

  return { isUrl: true, productName, platform, resolvedUrl };
}

module.exports = {
  resolveShortUrl,
  isShortOrRedirectUrl,
  detectPlatform,
  normalizeProductUrl,
  normalizePath,
  extractAmazonTitle,
  extractFlipkartTitle,
  slugToReadable,
  extractProductName,
};
