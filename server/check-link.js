// POST /api/check-link  { urls: ["https://..."] }
//
// Shared by both hosts: functions/api/check-link.js (Cloudflare Pages) and
// api/check-link.js (Vercel) are thin wrappers around checkLinks().
//
// Online checks the browser can't do by itself. Only links are sent here,
// never the message text. Nothing is stored.
//   - Expands known URL shorteners (bit.ly etc.) by reading their redirect,
//     without ever loading the destination page.
//   - Domain registration date via RDAP, straight from each registry (free, no key).
//   - Google Safe Browsing (optional, GSB_API_KEY; free for non-commercial use).
//   - abuse.ch URLhaus (optional, URLHAUS_AUTH_KEY; free account).
// Every check fails soft: the browser shows "couldn't check" rather than "clean".

import { getRegistrableDomain, isIpAddress, parseWebUrl, URL_SHORTENERS } from '../public/js/engine/domains.js';

// Cloudflare can cache these lookups at the edge; other runtimes ignore it.
const EDGE_CACHE = globalThis.navigator?.userAgent === 'Cloudflare-Workers'
  ? { cf: { cacheTtl: 86400, cacheEverything: true } }
  : {};

const MAX_URLS = 5;
const TIMEOUT_MS = 4000;
const MAX_REDIRECTS = 5;

/** env: { GSB_API_KEY?, URLHAUS_AUTH_KEY? } */
export async function checkLinks(request, env = {}) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST' });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const urls = Array.isArray(body?.urls) ? body.urls.filter((u) => typeof u === 'string').slice(0, MAX_URLS) : [];
  if (!urls.length) return json({ error: 'no_urls' }, 400);

  const results = await Promise.all(urls.map((u) => checkOne(u, env).catch(() => ({ input: u, ok: false }))));
  return json({ results }, 200, { 'Cache-Control': 'no-store' });
}

async function checkOne(input, env) {
  const parsed = parseWebUrl(input);
  if (!parsed) return { input, ok: false, error: 'invalid_url' };
  const start = parsed.url;

  let finalUrl = start.href;
  let redirects = [];
  if (URL_SHORTENERS.has(start.hostname.replace(/^www\./, ''))) {
    ({ finalUrl, redirects } = await expandShortLink(start));
  }

  const final = new URL(finalUrl);
  const host = final.hostname.toLowerCase();
  const registrable = getRegistrableDomain(host);

  const [registration, safeBrowsing, urlhaus] = await Promise.all([
    isIpAddress(host) ? { status: 'unavailable' } : lookupRegistration(registrable),
    checkSafeBrowsing([...new Set([start.href, finalUrl])], env.GSB_API_KEY),
    checkUrlhaus([...new Set([start.href, finalUrl])], env.URLHAUS_AUTH_KEY),
  ]);

  return { input, ok: true, finalUrl, redirects, host, registrable, registration, safeBrowsing, urlhaus };
}

/** Follow redirects only while they stay on known shorteners; never fetch the destination. */
async function expandShortLink(start) {
  let current = start;
  const redirects = [];
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    if (!URL_SHORTENERS.has(current.hostname.replace(/^www\./, ''))) break;
    let res;
    try {
      res = await fetchWithTimeout(current.href, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'CheckAm link checker' } });
    } catch {
      break;
    }
    const location = res.headers.get('location');
    res.body?.cancel();
    if (res.status < 300 || res.status >= 400 || !location) break;
    let next;
    try {
      next = new URL(location, current);
    } catch {
      break;
    }
    if (next.protocol !== 'http:' && next.protocol !== 'https:') break;
    redirects.push(next.href);
    current = next;
  }
  return { finalUrl: current.href, redirects };
}

// IANA's official list of which registry answers RDAP for each TLD.
const RDAP_BOOTSTRAP = 'https://data.iana.org/rdap/dns.json';
let bootstrap = null; // { fetchedAt, servers: Map<tld, baseUrl> }

async function rdapServerFor(domain) {
  if (!bootstrap || Date.now() - bootstrap.fetchedAt > 86400000) {
    const res = await fetchWithTimeout(RDAP_BOOTSTRAP, EDGE_CACHE);
    if (!res.ok) throw new Error('bootstrap');
    const data = await res.json();
    const servers = new Map();
    for (const [tlds, urls] of data.services || []) {
      const base = urls.find((u) => u.startsWith('https://')) || urls[0];
      for (const tld of tlds) servers.set(tld.toLowerCase(), base.endsWith('/') ? base : base + '/');
    }
    bootstrap = { fetchedAt: Date.now(), servers };
  }
  const labels = domain.split('.');
  // Longest match first so e.g. "com.ng" would win over "ng" if listed.
  for (let i = 1; i < labels.length; i++) {
    const server = bootstrap.servers.get(labels.slice(i).join('.'));
    if (server) return server;
  }
  return null;
}

async function lookupRegistration(domain) {
  try {
    const server = await rdapServerFor(domain);
    if (!server) return { status: 'unavailable' };
    const res = await fetchWithTimeout(`${server}domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json', 'User-Agent': 'CheckAm link checker' },
      ...EDGE_CACHE,
    });
    if (res.status === 404) return { status: 'not_registered' };
    if (!res.ok) return { status: 'unavailable' };
    const data = await res.json();
    const event = (data.events || []).find((e) => e.eventAction === 'registration');
    if (!event?.eventDate) return { status: 'unavailable' };
    const date = new Date(event.eventDate);
    if (Number.isNaN(date.getTime())) return { status: 'unavailable' };
    const ageDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    return { status: 'found', date: date.toISOString().slice(0, 10), ageDays };
  } catch {
    return { status: 'unavailable' };
  }
}

async function checkSafeBrowsing(urls, apiKey) {
  if (!apiKey) return { status: 'not_configured' };
  try {
    const res = await fetchWithTimeout(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'checkam', clientVersion: '0.1.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: urls.map((url) => ({ url })),
        },
      }),
    });
    if (!res.ok) return { status: 'error' };
    const data = await res.json();
    const threats = [...new Set((data.matches || []).map((m) => m.threatType))];
    return threats.length ? { status: 'listed', threats } : { status: 'clean' };
  } catch {
    return { status: 'error' };
  }
}

async function checkUrlhaus(urls, authKey) {
  if (!authKey) return { status: 'not_configured' };
  try {
    const answers = await Promise.all(urls.map(async (url) => {
      const res = await fetchWithTimeout('https://urlhaus-api.abuse.ch/v1/url/', {
        method: 'POST',
        headers: { 'Auth-Key': authKey, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ url }).toString(),
      });
      if (!res.ok) throw new Error('urlhaus');
      return res.json();
    }));
    const hit = answers.find((a) => a.query_status === 'ok');
    return hit ? { status: 'listed', threat: hit.threat || 'malware' } : { status: 'clean' };
  } catch {
    return { status: 'error' };
  }
}

function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}
