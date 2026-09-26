// CheckAm's analysis engine. Pure function: text in, report out. Runs in the
// browser (so messages never leave the phone) and in Node for tests.
//
//   analyze(text, { source, online })
//     source: 'text' | 'image' | 'share'
//     online: undefined (no link checks yet) | { status: 'pending' | 'done' | 'failed', results }
//
// The report never says "safe". The best a message can get is "unclear".

import { TEXT_RULES, buildFlags, normalizeText, MONEY_REQUEST_RE } from './rules.js';
import { extractUrls, extractEmails, analyzeLink } from './links.js';
import { ORGS } from './sources.js';
import { FREE_EMAIL_DOMAINS } from './domains.js';

const WEIGHT = { critical: 100, high: 3, medium: 2, low: 1 };
const RANK = { critical: 0, high: 1, medium: 2, low: 3 };
const DANGER_SCORE = 6;
const CAUTION_SCORE = 2;

const CATEGORY_ADVICE = {
  job: ['job-no-fee', 'job-official-careers', 'job-search-name'],
  bank: ['bank-use-app', 'never-share-codes', 'bank-branch'],
  government: ['govt-check-govng', 'govt-no-fee'],
  prize: ['prize-didnt-enter', 'prize-no-fee'],
  family: ['family-call-old-number', 'family-ask-others'],
  investment: ['invest-sec', 'invest-too-good'],
  delivery: ['delivery-track', 'delivery-expecting'],
  reversal: ['reversal-check-balance', 'reversal-bank'],
  receipt: ['receipt-check-app', 'receipt-no-release', 'receipt-session-id'],
  shopping: ['shop-pay-on-delivery', 'shop-reviews'],
  loan: ['loan-fccpc'],
  general: [],
};

const PHONE_RE = /(?:\+?234[\s-]?|\b0)[789][01]\d[\s-]?\d{3}[\s-]?\d{4}\b/;
const NUBAN_RE = /(?<![\d+])\d{10}(?!\d)/;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ORG_MENTION_RES = ORGS.filter((o) => o.mentions.length).map((org) => ({
  org,
  re: new RegExp(String.raw`\b(?:${org.mentions.map(escapeRe).join('|')})\b`),
}));

function mentionedOrgs(text) {
  return ORG_MENTION_RES.filter(({ re }) => re.test(text)).map(({ org }) => org);
}

function detectCategory(ids, flags) {
  const has = (...xs) => xs.some((x) => ids.has(x));
  if (has('new-number-money', 'new-number', 'emergency-money')) return 'family';
  if (has('wrong-transfer')) return 'reversal';
  if (has('payment-receipt')) return 'receipt';
  if (has('investment-scheme', 'easy-money')) return 'investment';
  if (has('job-red-flags') || flags.job) return 'job';
  if (has('grant-offer') || flags.grant) return 'government';
  if (has('loan-offer')) return 'loan';
  if (has('delivery-hold') || flags.delivery) return 'delivery';
  if (has('too-good-prize')) return 'prize';
  if (has('credential-request', 'id-request', 'threat-urgency') || flags.bank) return 'bank';
  if (has('gadget-deal') || flags.shopping) return 'shopping';
  return 'general';
}

export function computeLevel(findings) {
  if (findings.some((f) => f.severity === 'critical')) return { level: 'danger', score: WEIGHT.critical };
  const score = findings.reduce((sum, f) => sum + WEIGHT[f.severity], 0);
  if (score >= DANGER_SCORE) return { level: 'danger', score };
  if (score >= CAUTION_SCORE) return { level: 'caution', score };
  return { level: 'unclear', score };
}

function dedupe(items, keyFn) {
  const seen = new Set();
  return items.filter((it) => {
    const k = keyFn(it);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Apply online results (domain age, blocklists, short-link expansion) to one link. */
function applyOnline(link, res, out) {
  let effective = link;
  if (res.finalUrl && link.shortener) {
    const expanded = analyzeLink(res.finalUrl);
    if (expanded && expanded.host !== link.host) {
      out.facts.push({ id: 'short-link-destination', tone: 'neutral', vars: { from: link.host, to: expanded.registrable } });
      out.findings.push(...expanded.findings);
      out.facts.push(...expanded.facts);
      effective = expanded;
    }
  } else if (link.shortener) {
    out.unknowns.push({ id: 'short-link-unknown', vars: { domain: link.host } });
  }

  const trusted = effective.org || effective.govng || effective.chatLink || effective.formLink || effective.shortener;
  const reg = res.registration || {};
  if (!trusted && !effective.platform) {
    if (reg.status === 'found' && typeof reg.ageDays === 'number') {
      if (reg.ageDays < 30) {
        out.findings.push({ id: 'new-domain', severity: 'high', vars: { domain: effective.registrable, days: reg.ageDays }, evidence: effective.registrable });
      } else if (reg.ageDays < 120) {
        out.findings.push({ id: 'young-domain', severity: 'medium', vars: { domain: effective.registrable, days: reg.ageDays }, evidence: effective.registrable });
      } else if (reg.date) {
        out.facts.push({ id: 'domain-age', tone: 'neutral', vars: { domain: effective.registrable, year: String(reg.date).slice(0, 4) } });
      }
    } else if (reg.status === 'not_registered') {
      out.facts.push({ id: 'domain-not-registered', tone: 'neutral', vars: { domain: effective.registrable } });
    } else {
      out.unknowns.push({ id: 'domain-age-unknown', vars: { domain: effective.registrable } });
    }
  }

  const sb = res.safeBrowsing || {};
  if (sb.status === 'listed') {
    const threat = (sb.threats && sb.threats[0]) || 'dangerous';
    out.findings.push({ id: 'safe-browsing-listed', severity: 'critical', vars: { domain: effective.registrable, threat: threatLabel(threat) }, evidence: link.url });
  } else if (sb.status === 'clean') {
    out.facts.push({ id: 'safe-browsing-clean', tone: 'neutral', vars: {} });
  }

  const uh = res.urlhaus || {};
  if (uh.status === 'listed') {
    out.findings.push({ id: 'urlhaus-listed', severity: 'critical', vars: { domain: effective.registrable }, evidence: link.url });
  } else if (uh.status === 'clean') {
    out.facts.push({ id: 'urlhaus-clean', tone: 'neutral', vars: {} });
  }
  return effective;
}

function threatLabel(t) {
  return ({
    SOCIAL_ENGINEERING: 'phishing / scam',
    MALWARE: 'malware',
    UNWANTED_SOFTWARE: 'unwanted software',
    POTENTIALLY_HARMFUL_APPLICATION: 'a harmful app',
  })[t] || 'dangerous';
}

export function analyze(rawText, { source = 'text', online } = {}) {
  const original = String(rawText || '').trim();
  if (!original) return null;
  const text = normalizeText(original);
  const flags = buildFlags(text);
  const orgs = mentionedOrgs(text);
  const impersonable = orgs.filter((o) => o.type !== 'platform');
  const ctx = { text, flags, orgs };

  const out = { findings: [], facts: [], unknowns: [] };

  // Quote evidence in the user's own capitalisation when positions line up.
  const sameLength = text.length === original.length;
  const quote = (hit) => (sameLength && hit.index !== undefined
    ? original.slice(hit.index, hit.index + hit.length).replace(/\s+/g, ' ').trim().slice(0, 100)
    : hit.evidence);

  // 1. Message text
  const fired = {};
  for (const rule of TEXT_RULES) {
    const hit = rule.test(ctx);
    if (!hit) continue;
    fired[rule.id] = { ...hit, evidence: quote(hit) };
    if (rule.hidden) continue;
    const severity = typeof rule.severity === 'function' ? rule.severity(ctx) : rule.severity;
    out.findings.push({ id: rule.id, severity, vars: {}, evidence: fired[rule.id].evidence });
  }

  const moneyRequest = MONEY_REQUEST_RE.exec(text);
  if (fired['new-number'] && moneyRequest) {
    out.findings = out.findings.filter((f) => f.id !== 'new-number');
    out.findings.push({ id: 'new-number-money', severity: 'critical', vars: {}, evidence: `${fired['new-number'].evidence} … ${moneyRequest[0].trim()}` });
  } else if (fired.emergency && moneyRequest) {
    out.findings.push({ id: 'emergency-money', severity: 'high', vars: {}, evidence: `${fired.emergency.evidence} … ${moneyRequest[0].trim()}` });
  }

  const hasAccountNumber = NUBAN_RE.test(text);
  if ((hasAccountNumber || /\baccount (?:number|no\.?|details)\b/.test(text))
      && /\b(?:pay|send|transfer|deposit)\b/.test(text)
      && !fired['wrong-transfer'] && !fired['unusual-payment'] && !fired['payment-receipt']) {
    out.findings.push({ id: 'personal-account-payment', severity: 'medium', vars: {}, evidence: (text.match(NUBAN_RE) || text.match(/\baccount (?:number|no\.?|details)\b/))[0] });
  }

  const emails = extractEmails(text);
  const orgLike = flags.job || flags.grant || flags.prize || flags.investment || flags.loan || flags.delivery || impersonable.length > 0;
  const freeEmail = emails.find((e) => FREE_EMAIL_DOMAINS.has(e.split('@')[1]));
  if (freeEmail && orgLike) {
    out.findings.push({ id: 'free-email-sender', severity: 'medium', vars: { email: freeEmail }, evidence: freeEmail });
  }

  // 2. Links
  const urls = extractUrls(original);
  const links = [];
  for (const u of urls) {
    const link = analyzeLink(u);
    if (!link) continue;
    out.findings.push(...link.findings);
    out.facts.push(...link.facts);

    let effective = link;
    const res = online && online.status === 'done' && (online.results || []).find((r) => r.input === u);
    if (res && res.ok) effective = applyOnline(link, res, out);
    else if (link.shortener) out.unknowns.push({ id: 'short-link-unknown', vars: { domain: link.host } });

    // Message claims to be from X but link goes elsewhere
    const alreadyFake = effective.findings.some((f) => f.id === 'lookalike-domain' || f.id === 'typosquat-domain');
    const checkable = !effective.chatLink && !effective.formLink && !(effective.shortener && effective === link);
    if (checkable && !alreadyFake) {
      const matchesMentioned = impersonable.some((o) => o.domains.includes(effective.registrable));
      const govMentioned = impersonable.some((o) => o.type === 'government' || o.type === 'exam');
      if (impersonable.length && !matchesMentioned && !(effective.govng && govMentioned)) {
        const o = impersonable[0];
        out.findings.push({
          id: 'brand-link-mismatch',
          severity: effective.org ? 'medium' : 'high',
          vars: { org: o.name, domain: effective.registrable, official: o.domains[0] },
          evidence: u,
        });
      } else if (!impersonable.length && flags.grant && flags.govt && !effective.govng && !effective.org) {
        out.findings.push({ id: 'govt-non-govng', severity: 'high', vars: { domain: effective.registrable }, evidence: u });
      }
    }
    links.push({ url: u, host: effective.host, registrable: effective.registrable, expanded: effective !== link });
  }

  if (urls.length && online) {
    if (online.status === 'pending') out.unknowns.push({ id: 'links-pending', vars: {} });
    if (online.status === 'failed') out.unknowns.push({ id: 'links-offline', vars: {} });
  }
  if (!urls.length) out.facts.push({ id: 'no-links', tone: 'neutral', vars: {} });

  // 3. What we can't know
  out.unknowns.unshift({ id: 'sender-identity', vars: {} });
  if (PHONE_RE.test(text)) out.unknowns.push({ id: 'phone-owner', vars: {} });
  if (hasAccountNumber && !fired['payment-receipt']) out.unknowns.push({ id: 'account-owner', vars: {} });
  if (emails.length) out.unknowns.push({ id: 'email-owner', vars: {} });
  if (flags.grant || flags.job || flags.prize) {
    if (impersonable.length) out.unknowns.push({ id: 'official-announcement', vars: { org: impersonable[0].name } });
    else out.unknowns.push({ id: 'official-announcement-generic', vars: {} });
  }
  if (fired['payment-receipt']) out.unknowns.push({ id: 'receipt-real', vars: {} });
  if (source === 'image') out.unknowns.push({ id: 'ocr-errors', vars: {} });

  // 4. Score
  const findings = dedupe(out.findings, (f) => `${f.id}|${f.vars.domain || ''}|${f.vars.org || ''}`)
    .sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  const facts = dedupe(out.facts, (f) => `${f.id}|${f.vars.domain || ''}|${f.vars.to || ''}`);
  const unknowns = dedupe(out.unknowns, (u) => `${u.id}|${u.vars.domain || ''}`);
  const { level, score } = computeLevel(findings);
  const ids = new Set(findings.map((f) => f.id));
  const category = detectCategory(ids, flags);

  // 5. How to check
  const advice = [];
  if (level !== 'unclear') advice.push({ id: 'pause', vars: {} });
  // Nothing alarming found: keep it to one relevant tip rather than a lecture.
  const categoryAdvice = level === 'unclear' ? CATEGORY_ADVICE[category].slice(0, 1) : CATEGORY_ADVICE[category];
  for (const id of categoryAdvice) advice.push({ id, vars: {} });
  // In family/reversal scams a bank name is where the money goes, not who is
  // pretending to write, so "visit their website" would be useless advice.
  const orgForAdvice = ['family', 'reversal', 'receipt'].includes(category) ? null
    : impersonable[0] || findings.map((f) => f.vars.orgId && ORGS.find((o) => o.id === f.vars.orgId)).find(Boolean);
  if (orgForAdvice) advice.push({ id: 'org-official-site', vars: { org: orgForAdvice.name, official: orgForAdvice.domains[0] } });
  advice.push({ id: 'independent-channel', vars: {} });
  if (ids.has('credential-request') || ids.has('id-request') || ids.has('click-to-verify')) advice.push({ id: 'never-share-codes', vars: {} });

  return {
    level,
    score,
    category,
    findings,
    facts,
    unknowns,
    advice: dedupe(advice, (a) => a.id).slice(0, 6),
    links,
    meta: {
      source,
      ruleIds: [...ids],
      orgIds: impersonable.map((o) => o.id),
      needsOnline: urls.length > 0,
    },
  };
}
