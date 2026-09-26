import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../public/js/engine/analyze.js';
import { analyzeLink, extractUrls } from '../public/js/engine/links.js';
import { getRegistrableDomain } from '../public/js/engine/domains.js';
import { FINDINGS, FACTS, UNKNOWNS, ADVICE } from '../public/js/engine/copy.js';

const ids = (r) => r.findings.map((f) => f.id);

// ---------- Scams: must be flagged ----------

const SCAMS = [
  ['job fee', 'Congratulations! You have been shortlisted for the Data Entry position at Shell. Pay a registration fee of N5,000 to secure your slot. Contact HR on WhatsApp 08031234567.', 'danger', ['upfront-fee']],
  ['bank block + lookalike link', 'Dear customer, your GTBank account will be blocked within 24hrs. Click the link to verify your BVN: http://gtbank-verify.xyz/login', 'danger', ['lookalike-domain', 'threat-urgency']],
  ['OTP request', 'Good afternoon sir, this is Access Bank customer care. Kindly send the OTP sent to your phone to complete your account upgrade.', 'danger', ['credential-request']],
  ['new number money', 'Hi mummy, this is my new number. My phone got spoilt. Abeg send me 20k urgently to this account 0123456789 Opay, I go explain later', 'danger', ['new-number-money']],
  ['FG grant on blogspot', 'FG Youth Empowerment Grant 2026: The federal government is giving ₦250,000 to youths. Apply now before slots finish: https://fg-youth-grant.blogspot.com', 'danger', ['grant-offer', 'free-hosting', 'govt-non-govng']],
  ['investment', 'Invest with us today! Guaranteed returns of 30% weekly on forex trading. Our account manager will guide you. Refer and earn!', 'danger', ['easy-money', 'investment-scheme']],
  ['like and earn (pidgin)', 'Work from home and earn ₦15,000 daily! Just like and earn from TikTok videos. No experience needed. Pay small activation fee of 3k to start.', 'danger', ['job-red-flags', 'upfront-fee']],
  ['rn-for-m swap', 'Your Moniepoint POS account has been restricted. Restore it at https://rnoniepoint.com/restore', 'danger', ['lookalike-domain']],
  ['typosquat', 'Your POS account has been restricted. Restore it at https://moniepiont.com/restore', 'danger', ['typosquat-domain']],
  ['gift card', 'I am stuck at the airport and need help. Please buy an iTunes gift card worth $200 and send me the code. Don\'t tell anyone.', 'danger', ['unusual-payment', 'secrecy']],
  ['419', 'I am Barrister James, your late relative left $4.5 million and you are the next of kin. Reply with your full name and phone number.', 'caution', ['inheritance-419']],
  ['parcel customs', 'DHL: Your parcel is held at customs. Pay the customs clearance fee of ₦4,500 at https://dhl-ng-delivery.top/pay to release it.', 'danger', ['delivery-hold', 'lookalike-domain']],
  ['wrong transfer', 'Hello, I mistakenly transferred 50,000 naira to your account. Please kindly reverse it to me, I beg you.', 'caution', ['wrong-transfer']],
  ['OTP in pidgin', 'Oga abeg, I send code to your phone by mistake. Abeg send me the code make I use am.', 'danger', ['credential-request']],
  ['free data promo', 'MTN FREE 20GB DATA! You have been selected as a lucky winner. Claim your prize now: bit.ly/mtn-free-data', 'caution', ['too-good-prize', 'shortened-link']],
];

for (const [name, text, level, mustInclude] of SCAMS) {
  test(`scam: ${name}`, () => {
    const r = analyze(text);
    assert.equal(r.level, level, `level for "${name}", got findings ${ids(r).join(', ')}`);
    for (const id of mustInclude) assert.ok(ids(r).includes(id), `"${name}" should include ${id}; got ${ids(r).join(', ')}`);
  });
}

// ---------- Ordinary messages: must NOT be called a scam ----------

const ORDINARY = [
  ['real OTP SMS', 'Your OTP is 482913. It expires in 5 minutes. Do not share it with anyone, including bank staff.'],
  ['debit alert', 'Acct: 01****789 Amt: NGN5,000.00 DR Desc: POS PURCHASE Date: 12-Sep-2026 Bal: NGN20,145.50'],
  ['friend chat', 'Hey, are we still meeting at 5pm? I will bring the notes for the exam.'],
  ['bank warning', 'GTBank will never ask for your PIN, OTP or password. Please do not share them with anyone.'],
  ['official link', 'Check your JAMB result on https://www.jamb.gov.ng/efacility'],
  ['school fee notice', 'Reminder: the post-UTME application fee is ₦2,000. Pay on the university portal.'],
  ['congratulations', 'Congratulations on your wedding! Wishing you both happiness.'],
];

for (const [name, text] of ORDINARY) {
  test(`ordinary: ${name}`, () => {
    const r = analyze(text);
    assert.notEqual(r.level, 'danger', `"${name}" should not be danger; got ${ids(r).join(', ')}`);
  });
}

test('ordinary messages with no signals are "unclear", never "safe"', () => {
  const r = analyze('Hey, are we still meeting at 5pm?');
  assert.equal(r.level, 'unclear');
  assert.ok(r.unknowns.some((u) => u.id === 'sender-identity'));
});

test('official domain gets a positive fact, not a finding', () => {
  const r = analyze('Check your JAMB result on https://www.jamb.gov.ng/efacility');
  assert.ok(r.facts.some((f) => f.id === 'official-link'));
  assert.equal(r.findings.filter((f) => f.severity !== 'low').length, 0);
});

// ---------- Links ----------

test('registrable domain handles Nigerian suffixes and tricks', () => {
  assert.equal(getRegistrableDomain('www.jamb.gov.ng'), 'jamb.gov.ng');
  assert.equal(getRegistrableDomain('login.gtbank.com.secure-verify.xyz'), 'secure-verify.xyz');
  assert.equal(getRegistrableDomain('fg-grant.blogspot.com'), 'fg-grant.blogspot.com');
  assert.equal(getRegistrableDomain('jumia.com.ng'), 'jumia.com.ng');
});

test('brand in subdomain of another domain is flagged', () => {
  const l = analyzeLink('https://gtbank.com.secure-verify.xyz/login');
  assert.ok(l.findings.some((f) => f.id === 'lookalike-domain'));
});

test('short brand keywords do not match ordinary words', () => {
  assert.ok(!analyzeLink('https://cuba-travel.com').findings.some((f) => f.id === 'lookalike-domain'));
  assert.ok(!analyzeLink('https://ubahfoundation.org').findings.some((f) => f.id === 'lookalike-domain'));
  assert.ok(!analyzeLink('https://opaque.io').findings.some((f) => f.id === 'lookalike-domain'));
  assert.ok(!analyzeLink('https://apply.com').findings.some((f) => f.id === 'typosquat-domain'));
});

test('character swaps are caught', () => {
  assert.ok(analyzeLink('https://0pay-support.com').findings.some((f) => f.id === 'lookalike-domain'));
});

test('at-sign trick and IP links', () => {
  assert.ok(analyzeLink('http://gtbank.com@evil.example/').findings.some((f) => f.id === 'at-sign-link'));
  assert.ok(analyzeLink('http://192.168.4.20/verify').findings.some((f) => f.id === 'ip-link'));
});

test('link extraction ignores emails and numbers', () => {
  assert.deepEqual(extractUrls('email hr@company.com or visit www.example.com. Price 2.5k'), ['www.example.com']);
});

test('message mentioning a bank but linking elsewhere is flagged', () => {
  const r = analyze('Zenith Bank: update your details here https://secure-update-portal.com');
  assert.ok(ids(r).includes('brand-link-mismatch'));
});

test('WhatsApp chat link is not treated as official WhatsApp', () => {
  const l = analyzeLink('https://wa.me/2348031234567');
  assert.ok(l.findings.some((f) => f.id === 'chat-link'));
  assert.ok(!l.facts.some((f) => f.id === 'official-link'));
});

test('Google Form on docs.google.com is not vouched for as Google', () => {
  const l = analyzeLink('https://docs.google.com/forms/d/e/abc/viewform');
  assert.ok(l.findings.some((f) => f.id === 'form-link'));
});

// ---------- Online results ----------

test('online: brand-new domain and Safe Browsing hit', () => {
  const text = 'Claim your reward: https://naija-rewards.com/claim';
  const r = analyze(text, {
    online: {
      status: 'done',
      results: [{ input: 'https://naija-rewards.com/claim', ok: true, registration: { status: 'found', ageDays: 3, date: '2026-09-23' }, safeBrowsing: { status: 'listed', threats: ['SOCIAL_ENGINEERING'] }, urlhaus: { status: 'clean' } }],
    },
  });
  assert.equal(r.level, 'danger');
  assert.ok(ids(r).includes('new-domain'));
  assert.ok(ids(r).includes('safe-browsing-listed'));
});

test('online: short link expanded to a lookalike domain', () => {
  const r = analyze('Verify your Opay account: https://bit.ly/abc123', {
    online: { status: 'done', results: [{ input: 'https://bit.ly/abc123', ok: true, finalUrl: 'https://opay-verify.online/login', registration: {}, safeBrowsing: { status: 'clean' }, urlhaus: {} }] },
  });
  assert.equal(r.level, 'danger');
  assert.ok(r.facts.some((f) => f.id === 'short-link-destination'));
  assert.ok(ids(r).includes('lookalike-domain'));
});

test('online: failure is reported as unknown, not as clean', () => {
  const r = analyze('see https://example-shop.com', { online: { status: 'failed' } });
  assert.ok(r.unknowns.some((u) => u.id === 'links-offline'));
});

// ---------- Copy completeness ----------

test('every id the engine can emit has English and Pidgin copy', () => {
  const samples = [...SCAMS.map((s) => s[1]), ...ORDINARY.map((s) => s[1])];
  for (const text of samples) {
    const r = analyze(text, { source: 'image' });
    for (const f of r.findings) {
      assert.ok(FINDINGS[f.id]?.title?.en && FINDINGS[f.id]?.title?.pcm && FINDINGS[f.id]?.why?.pcm, `copy for finding ${f.id}`);
    }
    for (const f of r.facts) assert.ok(FACTS[f.id]?.en && FACTS[f.id]?.pcm, `copy for fact ${f.id}`);
    for (const u of r.unknowns) assert.ok(UNKNOWNS[u.id]?.en && UNKNOWNS[u.id]?.pcm, `copy for unknown ${u.id}`);
    for (const a of r.advice) assert.ok(ADVICE[a.id]?.en && ADVICE[a.id]?.pcm, `copy for advice ${a.id}`);
  }
});

// ---------- Interface text ----------

test('interface text loads and every key exists in English and Pidgin', async () => {
  const { UI } = await import('../public/js/ui-strings.js');
  const en = Object.keys(UI.en).sort();
  const pcm = Object.keys(UI.pcm).sort();
  assert.deepEqual(pcm, en);
  for (const k of en) assert.ok(UI.en[k] && UI.pcm[k], `ui string ${k}`);
});

test('contact config builds WhatsApp and email links', async () => {
  const { whatsappLink, emailLink } = await import('../public/js/config.js');
  assert.match(whatsappLink('hi'), /^https:\/\/wa\.me\/\d+\?text=hi$/);
  assert.match(emailLink('s', 'b'), /^mailto:[^?]+@[^?]+\?subject=s&body=b$/);
});
