// Finds links in a message and checks them without touching the network.
import {
  parseWebUrl, getRegistrableDomain, hostingPlatformFor, isIpAddress, secondLevelLabel,
  tldOf, normalizeLookalike, levenshtein, URL_SHORTENERS, RISKY_TLDS,
} from './domains.js';
import { ORGS, CHAT_LINK_HOSTS, FORM_LINKS, orgForDomain, isGovNg } from './sources.js';

// TLDs we accept for bare links like "gtbank-verify.com/login" (no http://).
// Anything with a scheme is picked up regardless of TLD.
const BARE_TLDS = 'com|ng|net|org|xyz|top|info|online|site|shop|live|click|link|me|io|co|app|dev|ly|gl|gd|cc|us|uk|biz|store|vip|icu|buzz|cfd|sbs|rest|club|website|space|tech|pro|tk|ml|ga|cf|gq|ee|ws|africa|support|help|lat|bond';
const URL_RE = new RegExp(
  String.raw`(?:https?:\/\/[^\s<>"'\u201c\u201d]+|www\.[^\s<>"'\u201c\u201d]+|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:${BARE_TLDS})\b(?:\/[^\s<>"'\u201c\u201d]*)?)`,
  'gi',
);

// Words that show up in phishing links and would be odd on a random website.
const SENSITIVE_WORDS = /(login|log-in|signin|sign-in|verify|verification|validate|update|secure|unlock|unblock|reactivat|bvn|nin-|otp|kyc|password|account|wallet|claim|reward|bonus|refund)/i;

// Stricter list for the website's own name ("bvnupdate-ng.com"), where words like
// "account" would also match honest sites such as accounting firms.
const SENSITIVE_DOMAIN_WORDS = /(bvn|nin-|otp|verify|verification|kyc|unblock|reactivat|login|signin|secure-|-secure|update-|-update)/i;

// For short brand keywords (opay, uba, mtn…), what can follow them inside a fake
// domain token: "opayverify", "mtnpromo", "uba2024". Stops "cuba" or "ubah" matching.
const PHISHY_SUFFIX = /^(\d+|ng|nigeria|verify|verification|secure|login|online|support|help|care|promo|grant|bonus|reward|update|bank|app|portal|service|alert|customer|account|free|gift|loan|pay|wallet|data|recharge|official|team|desk|center|centre|unlock|reset|win|plc|mobile|web|net|hq)/;

export function extractUrls(text) {
  const found = [];
  const seen = new Set();
  for (const m of String(text || '').matchAll(URL_RE)) {
    const before = text[m.index - 1];
    if (before === '@') continue; // part of an email address
    let raw = m[0].replace(/[.,;:!?)\]'"\u2019]+$/, '');
    if (/^[a-z0-9.-]+$/i.test(raw) && /\.\d+$/.test(raw)) continue; // "2.5" style numbers
    const parsed = parseWebUrl(raw);
    if (!parsed) continue;
    const key = parsed.url.href.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(raw);
    if (found.length >= 10) break;
  }
  return found;
}

export function extractEmails(text) {
  return [...new Set((String(text || '').match(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi) || []).map((e) => e.toLowerCase()))];
}

function hostTokens(host) {
  return host.split(/[.-]+/).filter(Boolean);
}

function keywordInToken(token, kw) {
  if (token === kw) return true;
  if (kw.length >= 6) return token.includes(kw);
  return token.startsWith(kw) && PHISHY_SUFFIX.test(token.slice(kw.length));
}

/** An org whose name appears inside this (non-official) host. */
function lookalikeOrg(host, registrable) {
  const tokens = [...hostTokens(host), ...hostTokens(normalizeLookalike(host))];
  for (const org of ORGS) {
    if (org.domains.includes(registrable)) continue;
    for (const kw of org.keywords) {
      if (tokens.some((t) => keywordInToken(t, kw))) return org;
    }
  }
  return null;
}

/**
 * An org whose brand name is one or two typos away from this domain's name
 * (gtbamk.com, m0niepoint.com). Only distinctive names of 6+ letters, and the
 * first letter must match, so ordinary words like "apply" or "power" don't trip it.
 */
function typosquatOrg(registrable) {
  const label = secondLevelLabel(registrable);
  const normalized = normalizeLookalike(label);
  if (label.length < 5) return null;
  for (const org of ORGS) {
    for (const kw of org.keywords) {
      if (kw.length < 6) continue;
      const allowed = kw.length >= 9 ? 2 : 1;
      for (const candidate of [label, normalized]) {
        if (candidate[0] !== kw[0]) continue;
        const dist = levenshtein(candidate, kw);
        if (dist <= allowed && label !== kw) return { org, official: org.domains[0] };
      }
    }
  }
  return null;
}

function matchesFormLink(url) {
  const host = url.hostname.replace(/^www\./, '');
  return FORM_LINKS.some((f) => host === f.host && (!f.path || url.pathname.startsWith(f.path)));
}

/**
 * Inspect a single link. Returns
 *   { url, host, registrable, org, govng, shortener, findings: [...], facts: [...] }
 * where findings/facts use ids from copy.js.
 */
export function analyzeLink(raw) {
  const parsed = parseWebUrl(raw);
  if (!parsed) return null;
  const { url, hasScheme } = parsed;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  const registrable = getRegistrableDomain(host);
  const tld = tldOf(host);
  const org = orgForDomain(registrable);
  const govng = isGovNg(registrable);
  const shortener = URL_SHORTENERS.has(host.replace(/^www\./, ''));
  const platform = hostingPlatformFor(host);
  const chatLink = CHAT_LINK_HOSTS.includes(host.replace(/^www\./, ''));
  const formLink = matchesFormLink(url);
  const findings = [];
  const facts = [];
  const vars = { domain: registrable, host, url: raw };

  const add = (id, severity, extra = {}) => findings.push({ id, severity, vars: { ...vars, ...extra }, evidence: raw });

  if (url.username || url.password) {
    add('at-sign-link', 'high');
  }

  if (isIpAddress(host)) {
    add('ip-link', 'high', { domain: host });
  } else if (host.split('.').some((l) => l.startsWith('xn--'))) {
    add('punycode-link', 'high', { domain: host });
  }

  if (chatLink) {
    add('chat-link', 'low');
  } else if (formLink) {
    add('form-link', 'medium');
  } else if (shortener) {
    add('shortened-link', 'medium', { domain: host });
  } else if (platform) {
    add('free-hosting', 'medium', { platform });
  } else if (org && org.type === 'platform') {
    facts.push({ id: 'known-platform', tone: 'neutral', vars: { domain: registrable, org: org.name } });
  } else if (org) {
    facts.push({ id: 'official-link', tone: 'good', vars: { domain: registrable, org: org.name } });
  } else if (govng) {
    facts.push({ id: 'govng-link', tone: 'good', vars: { domain: registrable } });
  }

  const trusted = (org && !platform) || govng || chatLink || formLink || shortener;
  if (!trusted && !isIpAddress(host)) {
    const look = lookalikeOrg(host, registrable);
    const typo = look ? null : typosquatOrg(registrable);
    if (look) {
      add('lookalike-domain', 'critical', { org: look.name, official: look.domains[0], orgId: look.id });
    } else if (typo) {
      add('typosquat-domain', 'critical', { org: typo.org.name, official: typo.official, orgId: typo.org.id });
    }
    if (RISKY_TLDS.has(tld)) add('risky-tld', 'low', { tld });
    if (SENSITIVE_WORDS.test(host.replace(registrable, '') + url.pathname + url.search)
        || SENSITIVE_DOMAIN_WORDS.test(secondLevelLabel(registrable))) add('sensitive-path', 'medium');
    const extraLabels = host.split('.').length - registrable.split('.').length;
    if (extraLabels >= 3 && !platform) add('deep-subdomain', 'low');
  }

  if (hasScheme && url.protocol === 'http:' && !shortener) add('no-https', 'low');

  return { url: raw, host, registrable, org, govng, shortener, platform, chatLink, formLink, findings, facts };
}
