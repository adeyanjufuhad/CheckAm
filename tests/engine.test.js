import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../public/js/engine/analyze.js';
import { analyzeLink, extractUrls } from '../public/js/engine/links.js';
import { getRegistrableDomain } from '../public/js/engine/domains.js';
import { FINDINGS, FACTS, UNKNOWNS, ADVICE, fmt } from '../public/js/engine/copy.js';

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
  ['too-cheap gadget', 'buy a macbook brand new m1 pro for 600k', 'caution', ['gadget-deal']],
  ['bank transfer receipt (OCR)', `Transaction Successful
N450,000.00
Transaction Type Transfer
Sender Name CHIDI OKAFOR
Beneficiary Name AMAKA STORES
Beneficiary Bank GTBank
Account Number 0123456789
Narration Payment for iPhone 15
Transaction Reference TRF2026092614523001
Session ID 100004260926145230019283`, 'caution', ['payment-receipt']],
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
  ['bought a phone', 'I finally bought a new iPhone yesterday, it cost me 900k but I love it'],
];

for (const [name, text] of ORDINARY) {
  test(`ordinary: ${name}`, () => {
    const r = analyze(text);
    assert.notEqual(r.level, 'danger', `"${name}" should not be danger; got ${ids(r).join(', ')}`);
  });
}

test('a receipt gets receipt advice, not "pay into this account" or bank-website advice', () => {
  const r = analyze('Transfer Successful. Sender Name: Chidi. Beneficiary Name: Amaka. Session ID 10000426. Amount N50,000');
  assert.equal(r.category, 'receipt');
  assert.ok(!ids(r).includes('personal-account-payment'));
  assert.ok(r.advice.some((a) => a.id === 'receipt-check-app'));
  assert.ok(r.unknowns.some((u) => u.id === 'receipt-real'));
});

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

// ---------- Prices ----------

test('too-cheap: land, amounts in many formats, dollars ignored, realistic prices left alone', async () => {
  const { parseAmounts, tooCheapOffer } = await import('../public/js/engine/prices.js');
  assert.deepEqual(parseAmounts('for 10k naira'), [10000]);
  assert.deepEqual(parseAmounts('n250,000 and 2.5 million naira'), [250000, 2500000]);
  assert.deepEqual(parseAmounts('camry 2018 rx350 iphone 15'), []);
  assert.deepEqual(parseAmounts('left $4.5 million'), []);
  assert.equal(tooCheapOffer('buy plot of land in ogun state for 10k naira').severity, 'critical');
  assert.equal(tooCheapOffer('plots in mowe going for 4 million per plot'), null);
  assert.equal(tooCheapOffer('my iphone screen repair cost 40k'), null);
});

test('item names render in the chosen language', () => {
  const r = analyze('buy plot of land in ogun state for 10k naira');
  const f = r.findings.find((x) => x.id === 'too-cheap');
  assert.equal(fmt(FINDINGS['too-cheap'].title.en, f.vars, 'en'), 'Price is far too low for a plot of land');
  assert.equal(fmt(FINDINGS['too-cheap'].title.pcm, f.vars, 'pcm'), 'The price too cheap for one plot of land');
  assert.equal(r.category, 'property');
  assert.ok(r.advice.some((a) => a.id === 'land-docs'));
});

test('uncertain results say money is involved instead of looking all-clear', () => {
  const r = analyze('generator for sale, call me');
  assert.equal(r.level, 'unclear');
  assert.ok(ids(r).includes('money-involved'));
});

// ---------- AI providers: retry and fallback ----------

const aiRequest = (text) => new Request('http://x/api/ai-check', { method: 'POST', body: JSON.stringify({ text, lang: 'en' }) });
const goodAnswer = { verdict: 'caution', signs: [{ title: 'Too cheap', why: 'The price is far too low.' }], checks: [] };

async function quietly(fn) {
  const original = console.error;
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.error = original;
  }
}

test('AI: a failed model falls back to the backup model', async () => {
  const { aiCheck } = await import('../server/ai-check.js');
  const calls = [];
  const env = { AI: { run: async (model) => {
    calls.push(model);
    if (calls.length === 1) throw new Error('3040: Capacity temporarily exceeded');
    return { response: goodAnswer };
  } } };
  const res = await quietly(() => aiCheck(aiRequest('land for 10k'), env));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 2);
  assert.notEqual(calls[0], calls[1]);
});

test('AI: every provider out of free allowance gives a clear "limit" error', async () => {
  const { aiCheck } = await import('../server/ai-check.js');
  const env = { AI: { run: async () => { throw new Error('4006: you have used up your daily free allocation of 10,000 neurons'); } } };
  const res = await quietly(() => aiCheck(aiRequest('land for 10k'), env));
  assert.equal(res.status, 429);
  assert.equal((await res.json()).error, 'ai_limit');
});

test('AI: Groq is tried first, and Workers AI takes over when Groq is rate-limited', async () => {
  const { aiCheck, providers } = await import('../server/ai-check.js');
  const env = { GROQ_API_KEY: 'test', AI: { run: async () => ({ response: goodAnswer }) } };
  assert.deepEqual(providers(env).map((p) => p.provider), ['groq', 'workers-ai', 'workers-ai']);
  const realFetch = globalThis.fetch;
  let groqBody;
  globalThis.fetch = async (url, init) => {
    groqBody = JSON.parse(init.body);
    return new Response('rate limited', { status: 429 });
  };
  try {
    const res = await quietly(() => aiCheck(aiRequest('land for 10k'), env));
    assert.equal(res.status, 200);
    assert.equal(groqBody.response_format.json_schema.strict, true);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('AI: Groq answer is used when it works', async () => {
  const { aiCheck } = await import('../server/ai-check.js');
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(goodAnswer) } }] }), { status: 200 });
  try {
    const res = await aiCheck(aiRequest('land for 10k'), { GROQ_API_KEY: 'test' });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).verdict, 'caution');
  } finally {
    globalThis.fetch = realFetch;
  }
});

// ---------- AI reading screenshots ----------

const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const imageRequest = (body) => new Request('http://x/api/ai-check', { method: 'POST', body: JSON.stringify({ lang: 'en', ...body }) });

test('AI screenshots: vision models only, picture attached, transcript returned', async () => {
  const { aiCheck, providers } = await import('../server/ai-check.js');
  const env = { GROQ_API_KEY: 'k', AI: { run: async () => ({ response: goodAnswer }) } };
  assert.deepEqual(providers(env, { vision: true }).map((p) => p.model), ['qwen/qwen3.8-27b', '@cf/meta/llama-4-scout-17b-16e-instruct']);

  const realFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (url, init) => {
    sent = JSON.parse(init.body);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ...goodAnswer, transcript: 'Pay  N50,000\n\n\n\nto secure your slot' }) } }] }), { status: 200 });
  };
  try {
    const res = await aiCheck(imageRequest({ image: TINY_PNG, text: 'Pay N5O,OOO' }), env);
    const out = await res.json();
    assert.equal(res.status, 200);
    assert.equal(out.transcript, 'Pay N50,000\n\nto secure your slot');
    const content = sent.messages[1].content;
    assert.ok(Array.isArray(content));
    assert.ok(content.some((c) => c.type === 'image_url' && c.image_url.url === TINY_PNG));
    assert.ok(content[0].text.includes('Pay N5O,OOO'));
    assert.ok(sent.response_format.json_schema.schema.required.includes('transcript'));
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('AI screenshots: literal "\\n" in the reading becomes real line breaks', async () => {
  const { sanitize } = await import('../server/ai-check.js');
  const out = sanitize({ ...goodAnswer, transcript: 'LAND FOR SALE\\nPay 50k deposit to secure' });
  assert.equal(out.transcript, 'LAND FOR SALE\nPay 50k deposit to secure');
  const r = analyze(out.transcript);
  assert.ok(ids(r).includes('upfront-fee'));
});

test('AI screenshots: rejects non-images and oversized pictures', async () => {
  const { aiCheck } = await import('../server/ai-check.js');
  const env = { AI: { run: async () => ({ response: goodAnswer }) } };
  assert.equal((await aiCheck(imageRequest({ image: 'data:text/html;base64,PGgxPg==' }), env)).status, 400);
  assert.equal((await aiCheck(imageRequest({ image: 'data:image/png;base64,' + 'A'.repeat(4_100_000) }), env)).status, 413);
});

// ---------- AI output guardrails ----------

test('AI output: no "safe" verdict, reassuring text dropped, unexplained verdicts downgraded', async () => {
  const { sanitize } = await import('../server/ai-check.js');
  assert.equal(sanitize({ verdict: 'safe', signs: [], checks: [] }).verdict, 'unclear');
  assert.equal(sanitize({ verdict: 'danger', signs: [], checks: [] }).verdict, 'unclear');
  const r = sanitize(JSON.stringify({
    verdict: 'caution',
    signs: [
      { title: 'Price far too low', why: 'A new M1 Pro MacBook costs much more than 600k.' },
      { title: 'Looks fine', why: 'This seller is legit and the message is safe.' },
    ],
    checks: ['This is genuine, go ahead.', 'Compare the price at trusted shops.'],
  }));
  assert.equal(r.verdict, 'caution');
  assert.deepEqual(r.signs.map((s) => s.title), ['Price far too low']);
  assert.deepEqual(r.checks, ['Compare the price at trusted shops.']);
  assert.equal(sanitize('not json at all'), null);
});
