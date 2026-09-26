// Domain helpers shared by the browser engine and the Cloudflare function.
// Deliberately small: no full Public Suffix List, just the suffixes Nigerians
// actually run into, so the whole engine stays light enough for cheap phones.

const MULTI_PART_SUFFIXES = new Set([
  'com.ng', 'gov.ng', 'edu.ng', 'org.ng', 'net.ng', 'sch.ng', 'mil.ng', 'name.ng', 'mobi.ng', 'i.ng',
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
  'com.gh', 'gov.gh', 'co.za', 'co.ke', 'com.au', 'co.in', 'com.br', 'com.cn',
]);

// Sites where anyone can get a free subdomain. The subdomain is the real "owner".
export const HOSTING_PLATFORMS = [
  'blogspot.com', 'wixsite.com', 'weebly.com', 'wordpress.com', 'netlify.app', 'vercel.app',
  'web.app', 'firebaseapp.com', 'github.io', 'pages.dev', 'workers.dev', 'glitch.me',
  '000webhostapp.com', 'herokuapp.com', 'onrender.com', 'repl.co', 'replit.app', 'carrd.co',
  'square.site', 'godaddysites.com', 'webflow.io', 'framer.website', 'framer.app',
  'mystrikingly.com', 'site123.me', 'jimdosite.com', 'wixstudio.com', 'sites.google.com',
  'ngrok.io', 'ngrok-free.app', 'trycloudflare.com',
];

export const URL_SHORTENERS = new Set([
  'bit.ly', 'bitly.com', 'tinyurl.com', 'cutt.ly', 't.ly', 'rb.gy', 'shorturl.at', 'is.gd', 'v.gd',
  'goo.gl', 'ow.ly', 'tiny.cc', 's.id', 't.co', 'buff.ly', 'rebrand.ly', 'bl.ink', 'shorte.st',
  'adf.ly', 'lnkd.in', 'tiny.one', 'shrtco.de', 'urlz.fr', 'qrco.de', 'trib.al', 'surl.li',
  'shorturl.asia', 'clck.ru', 'u.to', 'rebrandly.com', 'short.gy', 'shorter.me',
]);

// Cheap/abused TLDs. A weak signal on its own: plenty of honest sites use them too.
export const RISKY_TLDS = new Set([
  'xyz', 'top', 'click', 'link', 'live', 'buzz', 'icu', 'online', 'site', 'shop', 'rest', 'cfd',
  'sbs', 'monster', 'quest', 'cyou', 'bond', 'work', 'fit', 'loan', 'win', 'bid', 'gq', 'ml',
  'cf', 'tk', 'ga', 'support', 'help', 'vip', 'club', 'info', 'lat', 'autos', 'hair', 'beauty',
]);

export const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'aol.com', 'proton.me', 'protonmail.com', 'icloud.com', 'mail.com', 'gmx.com', 'zoho.com',
]);

export function isIpAddress(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || /^\[.*\]$/.test(host);
}

/** Returns the hosting platform suffix a host sits on (e.g. "blogspot.com"), or null. */
export function hostingPlatformFor(host) {
  return HOSTING_PLATFORMS.find((p) => host === p || host.endsWith('.' + p)) || null;
}

/**
 * The part of a hostname someone actually registered/controls:
 *   login.gtbank.com.secure-verify.xyz -> secure-verify.xyz
 *   www.jamb.gov.ng                   -> jamb.gov.ng
 *   fg-grant.blogspot.com             -> fg-grant.blogspot.com (free-hosting subdomain)
 */
export function getRegistrableDomain(host) {
  host = String(host || '').toLowerCase().replace(/\.$/, '');
  if (!host || isIpAddress(host)) return host;
  const platform = hostingPlatformFor(host);
  if (platform) {
    if (host === platform) return host;
    const rest = host.slice(0, -(platform.length + 1)).split('.');
    return rest[rest.length - 1] + '.' + platform;
  }
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  const lastTwo = parts.slice(-2).join('.');
  return MULTI_PART_SUFFIXES.has(lastTwo) ? parts.slice(-3).join('.') : lastTwo;
}

/** First label of the registrable domain: "gtbank" for gtbank.com, "jamb" for jamb.gov.ng. */
export function secondLevelLabel(registrable) {
  return String(registrable || '').split('.')[0];
}

export function tldOf(host) {
  const parts = String(host || '').split('.');
  return parts[parts.length - 1];
}

/** Undo common character swaps scammers use: 0pay -> opay, gtbarnk -> gtbamk. */
export function normalizeLookalike(s) {
  return String(s || '').toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/4/g, 'a')
    .replace(/5/g, 's').replace(/7/g, 't').replace(/rn/g, 'm').replace(/vv/g, 'w');
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Parse something that may or may not have a scheme. Returns null if it isn't a usable web URL. */
export function parseWebUrl(raw) {
  const s = String(raw || '').trim();
  if (!s || s.length > 2048) return null;
  const hasScheme = /^https?:\/\//i.test(s);
  try {
    const url = new URL(hasScheme ? s : 'http://' + s);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname || !url.hostname.includes('.')) return null;
    return { url, hasScheme };
  } catch {
    return null;
  }
}
