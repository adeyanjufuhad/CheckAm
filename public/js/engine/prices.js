// Price sanity checks: "plot of land in Ogun for 10k", "Camry 2018 for 450k".
//
// PRICE FLOORS ARE DELIBERATELY LOW. Each is well under the cheapest genuine
// price we'd expect in Nigeria (September 2026), so a real offer should never
// be under it. Review them every 6 months: prices rise with inflation, and a
// stale floor only makes CheckAm quieter, never louder.

export const PRICE_FLOORS = [
  { id: 'land', re: /\b(?:plots?|land|acres?|hectares?)\b/, floor: 300_000, item: { en: 'a plot of land', pcm: 'one plot of land' } },
  { id: 'house', re: /\b(?:duplex|bungalow|terrace(?:d)? house|detached house|mansion|house for sale|\d[- ]?bedroom (?:house|duplex|bungalow))\b/, floor: 5_000_000, item: { en: 'a house', pcm: 'house' } },
  { id: 'car', re: /\b(?:toyota|lexus|honda|mercedes|benz|bmw|camry|corolla|highlander|venza|sienna|rav ?4|prado|land cruiser|hilux|kia|hyundai|ford|peugeot|nissan|range rover|tokunbo car|cars? for sale)\b/, floor: 1_500_000, item: { en: 'a car', pcm: 'motor' } },
  { id: 'iphone-pro', re: /\biphone ?1[3-9] ?pro\b/, floor: 500_000, item: { en: 'a recent iPhone Pro', pcm: 'new iPhone Pro' } },
  { id: 'iphone', re: /\biphone\b/, floor: 100_000, item: { en: 'an iPhone', pcm: 'iPhone' } },
  { id: 'macbook', re: /\bmac ?book\b/, floor: 350_000, item: { en: 'a MacBook', pcm: 'MacBook' } },
  { id: 'ps5', re: /\b(?:ps5|playstation ?5)\b/, floor: 250_000, item: { en: 'a PS5', pcm: 'PS5' } },
  { id: 'samsung-flagship', re: /\b(?:galaxy )?(?:s2[2-9]|z ?fold|z ?flip)(?: ultra)?\b/, floor: 300_000, item: { en: 'a recent Samsung Galaxy', pcm: 'new Samsung Galaxy' } },
];

// Only price offers count, not "I bought", repairs, rent or accessories.
const OFFER_RE = /\b(?:buy|sell|selling|sale|for sale|dey sale|available|going for|price|promo|only|order|dispatch|deliver\w*|deposit|secure)\b|\b(?:for|na|at|@)\s*(?:₦|n|ngn)?\s?\d/;
const NOT_A_SALE_RE = /\b(?:repair|screen|fix(?:ed|ing)?|battery|charger|case|cover|pouch|accessor\w*|spare parts?|parts|rent(?:al)?|to let|hire|lease|per (?:day|night|hour|trip|month|annum|year)|yearly|monthly|installments?|bought|paid for)\b/;

const MULTIPLIER = { k: 1e3, thousand: 1e3, m: 1e6, mil: 1e6, million: 1e6 };

/**
 * Naira amounts in the text. Needs a currency marker (₦, N, NGN, naira), a
 * multiplier (k, m, million, thousand) or comma grouping, so years (2018) and
 * model numbers (iPhone 15, RX350) aren't read as prices. Dollars are skipped.
 */
export function parseAmounts(text) {
  const out = [];
  const re = /(₦|\bngn\s?|\bn(?=\s?\d)|\bnaira\s)?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s?(k|m|mil|million|thousand)?\b(\s?naira)?/g;
  for (const m of text.matchAll(re)) {
    const [, currency, digits, mult, nairaAfter] = m;
    const before = text[m.index - 1];
    if (before === '$' || before === '£' || before === '€') continue;
    if (/^\s?(?:dollars?|usd|pounds?|euros?)/.test(text.slice(m.index + m[0].length))) continue;
    const grouped = digits.includes(',');
    if (!currency && !mult && !nairaAfter && !grouped) continue;
    const value = Number(digits.replace(/,/g, '')) * (mult ? MULTIPLIER[mult] : 1);
    if (Number.isFinite(value) && value > 0) out.push(value);
  }
  return out;
}

export function formatNaira(n) {
  return '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * { item, price, floor, severity } when a big-ticket item is offered far
 * below its floor, else null. Uses the largest amount mentioned, so a small
 * deposit next to a realistic price doesn't trigger it.
 */
export function tooCheapOffer(text) {
  if (!OFFER_RE.test(text) || NOT_A_SALE_RE.test(text)) return null;
  const amounts = parseAmounts(text);
  if (!amounts.length) return null;
  const price = Math.max(...amounts);
  const match = PRICE_FLOORS.find((p) => p.re.test(text));
  if (!match || price >= match.floor) return null;
  return {
    id: match.id,
    item: match.item,
    price,
    floor: match.floor,
    severity: price < match.floor / 5 ? 'critical' : 'high',
  };
}
