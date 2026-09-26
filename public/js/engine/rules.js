// Text rules: patterns in the message itself (English + common Pidgin phrasing).
//
// Each rule returns { evidence } when it fires, or null. Severity:
//   critical  on its own means "strong signs of a scam"
//   high = 3, medium = 2, low = 1 points
// Keep patterns specific. A rule that fires on ordinary messages teaches
// people to ignore CheckAm, which is worse than missing a weak signal.

import { tooCheapOffer, formatNaira } from './prices.js';

const AMOUNT = String.raw`(?:(?:₦|\bn|\bngn|\bnaira)\s?\d[\d,]*(?:\.\d+)?\s?(?:k|m)?\b|\b\d[\d,]*(?:\.\d+)?\s?(?:k|naira|thousand)\b)`;
const NEGATION = /\b(?:never|not|don'?t|do not|won'?t|will not|no go|no dey|cannot|can'?t|should not|shouldn'?t)\b[^.!?\n]{0,20}$/;

const CONTEXT = {
  job: /\b(?:job|position|vacanc\w*|recruit\w*|employ\w*|hiring|interview|salary|hr\b|human resources?|work from home|internship|applicant|shortlisted|offer letter|data entry|remote work|part[- ]time|full[- ]time)\b/,
  prize: /\b(?:won|winner|win|promo|prize|reward|giveaway|lottery|raffle|lucky|selected|congratulations?|congrats|bonus)\b/,
  grant: /\b(?:grant|palliative|empowerment|n-?power|scholarship|stipend|bursary|cash transfer|relief fund|intervention|tradermoni|survival fund|student loan|nelfund)\b/,
  govt: /\b(?:federal government|fgn?|government|ministry|minister|cbn|central bank|efcc|nimc|nysc|jamb|presiden\w*|tinubu|state government|governor|agency)\b/,
  loan: /\b(?:loans?|lender|borrow)\b/,
  bank: /\b(?:bank|account|atm|card|bvn|transfer|alert|debit|credit|wallet|opay|palmpay|moniepoint|kuda|ussd)\b/,
  investment: /\b(?:invest\w*|trading|forex|crypto\w*|bitcoin|profit|returns?|roi|dividend|portfolio|mining)\b/,
  delivery: /\b(?:package|parcel|consignment|shipment|delivery|courier|dhl|customs|waybill|tracking)\b/,
  shopping: /\b(?:order|vendor|seller|in stock|dm (?:to|for) (?:order|price)|pay (?:before|first)|price|buy now|instagram (?:store|shop|vendor)|jiji)\b/,
  travel: /\b(?:visa|abroad|canada|uk|usa|ielts|relocat\w*|japa|work permit|travel)\b/,
  family: /\b(?:mum|mom|mummy|mama|dad|daddy|papa|bro|sis|aunty|auntie|uncle|cousin|my dear|dear friend|babe|darling|son|daughter)\b/,
};

function evidence(text, index, length) {
  return text.slice(index, index + length).replace(/\s+/g, ' ').trim().slice(0, 100);
}

function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) return { evidence: evidence(text, m.index, m[0].length), index: m.index, length: m[0].length };
  }
  return null;
}

/** First match not preceded by a negation ("never share your OTP"). */
function firstUnnegated(text, re) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  for (const m of text.matchAll(g)) {
    if (!NEGATION.test(text.slice(Math.max(0, m.index - 30), m.index))) {
      return { evidence: evidence(text, m.index, m[0].length), index: m.index, length: m[0].length };
    }
  }
  return null;
}

// Shared bits of pattern
const SECRET_NOUN = String.raw`(?:otp|one[- ]time (?:password|pin|code)|atm pin|card pin|pin|password|passcode|cvv|cvc|card (?:number|details)|atm card (?:number|details)|token(?: code)?|login details|internet banking details|verification code|security code|the code (?:sent|we sent|i sent)|code (?:sent|we sent) to (?:you|your))`;
const ID_NOUN = String.raw`(?:bvn|bank verification number|nin|national identification number)`;
const ASK_VERB = String.raw`(?:send|share|provide|give|enter|input|type|confirm|verify|update|submit|reply(?: with)?|forward|tell|drop|read out|fill in|input)`;

const CREDENTIAL_RE = new RegExp(String.raw`\b${ASK_VERB}\b[^.!?\n]{0,40}?\b${SECRET_NOUN}\b`);
const CODE_BACK_RE = [
  /\b(?:send|forward|give|tell)\s+(?:me|us)\s+(?:the |that |your )?(?:\d[- ]digit )?code\b/,
  /\bcode\b[^.!?\n]{0,60}\b(?:by mistake|mistakenly|wrongly)\b/,
  /\b(?:by mistake|mistakenly|wrongly|in error)\b[^.!?\n]{0,40}\bcode\b/,
  /\bcode\b[^.!?\n]{0,60}\b(?:forward|send|give|share)\s+(?:it|am)\b/,
];
const ID_RE = new RegExp(String.raw`\b${ASK_VERB}\b[^.!?\n]{0,40}?\b${ID_NOUN}\b`);

const feeContext = (flags) => flags.job || flags.prize || flags.grant || flags.loan || flags.delivery || flags.travel;

// Fees that only make sense as a scam, whatever the context.
const STRONG_FEE_RE = new RegExp([
  String.raw`\b(?:processing|activation|clearance|release|handling|documentation|accreditation|onboarding|commitment|refundable|approval|unlocking|upgrade|verification|insurance|customs|registration)\s+(?:fees?|charges?|levy)\b`,
  String.raw`\bpay\b[^.!?\n]{0,50}\bto\s+(?:secure|claim|receive|release|unlock|activate|process|confirm|redeem|reserve|hold|book)\b`,
  String.raw`\bpay\b[^.!?\n]{0,40}\bfor\b[^.!?\n]{0,30}\b(?:processing|registration|activation|clearance|verification|upgrade|renewal|accreditation|documentation)\b`,
  String.raw`\bpay small\b`,
  String.raw`\bpay (?:a |the )?small (?:fee|amount|token|charge)\b`,
  String.raw`\bbefore (?:we|you|dem|i|they|them) (?:can |will )?(?:release|send|pay|credit|disburse|process)\b[^.!?\n]{0,40}\b(?:pay|fee|charge)`,
  String.raw`\b(?:want|need|demand|collect)\w*\s+${AMOUNT}[^.!?\n]{0,20}\bbefore (?:they|dem|we|them) (?:release|clear|let)\b`,
].join('|'));

// Fees that are normal for schools and shops, suspicious for jobs/prizes/grants.
const CONTEXT_FEE_RE = new RegExp([
  String.raw`\b(?:application|form|training|medical|visa|admin(?:istrative)?|delivery|shipping|logistics|tax|certificate|uniform|id card)\s+(?:fees?|charges?|levy|payment)\b`,
  String.raw`\bfee of ${AMOUNT}`,
  String.raw`\bpay\b[^.!?\n]{0,50}\bto\s+(?:get|complete)\b`,
].join('|'));

const RECEIPT_MARKERS = [
  /\btransaction (?:successful|receipt|details|reference|date|type|status|id)\b/,
  /\b(?:transfer|payment) (?:successful|receipt|completed)\b/,
  /\bsession id\b/,
  /\bbeneficiary (?:name|bank|account|details)\b/,
  /\bsender(?:'s)? (?:name|bank|account|details)\b/,
  /\bnarration\b/,
  /\b(?:ref(?:erence)?|txn|trans(?:action)?) ?(?:no|number|id|ref)\b/,
  /\b(?:share|download) receipt\b/,
  /\bcredit alert\b/,
  /\b(?:recipient|receiver)(?:'s)? (?:name|bank|account)\b/,
];
const AMOUNT_RE = new RegExp(AMOUNT);
const GADGET_RE = /\b(?:iphone|macbook|mac book|ipad|imac|apple watch|airpods|ps5|ps4|playstation|xbox|nintendo switch|samsung (?:galaxy )?(?:s|z|note) ?\d+|galaxy (?:s|z|note) ?\d+|pixel \d+|laptop|elitebook|thinkpad|dell xps|gaming pc|rtx ?\d{4}|drone|starlink|generator|inverter)\b/;
const SELLING_RE = /\b(?:buy|sell|selling|for sale|going for|available|in stock|brand new|uk used|tokunbo|sealed|price|cheap|promo|discount|slashed|dm|order|clearance sale|pay (?:before|first))\b/;

export const MONEY_REQUEST_RE = new RegExp([
  String.raw`\b(?:send|transfer|borrow|lend|loan|help)\b[^.!?\n]{0,30}\b(?:me|us)\b[^.!?\n]{0,40}(?:money|cash|${AMOUNT})`,
  String.raw`\babeg\b[^.!?\n]{0,30}\b(?:send|transfer|help|borrow)\b`,
  String.raw`\b(?:send|transfer)\s+${AMOUNT}`,
  String.raw`\b(?:i need|need)\s+${AMOUNT}`,
  String.raw`\b(?:please|pls|abeg|kindly)\s+(?:send|transfer)\s+(?:it|am|the money|me|us)\b`,
  String.raw`\b(?:send|transfer)\s+${AMOUNT}[^.!?\n]{0,40}\baccount\b`,
  String.raw`\bsend\b[^.!?\n]{0,30}\bto (?:this|my) account\b`,
].join('|'));

export const TEXT_RULES = [
  {
    id: 'credential-request',
    severity: 'critical',
    test: ({ text }) => firstUnnegated(text, CREDENTIAL_RE) || firstMatch(text, CODE_BACK_RE),
  },
  {
    id: 'id-request',
    severity: 'high',
    test: ({ text }) => firstUnnegated(text, ID_RE),
  },
  {
    id: 'upfront-fee',
    // Critical when tied to a job/prize/grant/loan/parcel. Elsewhere (a school's
    // application fee, a shop's delivery fee) it's normal life, so only medium.
    severity: (ctx) => (feeContext(ctx.flags) ? 'critical' : 'medium'),
    test: ({ text, flags }) => firstUnnegated(text, STRONG_FEE_RE)
      || (feeContext(flags) && firstUnnegated(text, CONTEXT_FEE_RE)),
  },
  {
    id: 'threat-urgency',
    severity: 'medium',
    test: ({ text }) => firstMatch(text, [
      /\b(?:account|card|line|sim|wallet|bvn|nin|profile|number|app)\b[^.!?\n]{0,40}\b(?:will be|has been|have been|is being|would be|go|don)\s+(?:permanently\s+|temporarily\s+)?(?:blocked|suspended|restricted|deactivated|closed|frozen|barred|disabled|terminated|locked|deleted|block|restrict|close|freeze|flagged|expired)\b/,
      /\b(?:atm |debit )?card has expired\b|\bto avoid (?:suspension|disconnection|deactivation|blocking|restriction)\b/,
      /\bwithin\s+(?:\d+|twenty[- ]four|forty[- ]eight|one|two|few)\s*(?:hours?|hrs?|minutes?|mins?|days?)\b/,
      /\b(?:final (?:warning|notice|reminder)|last (?:warning|chance)|expires? (?:today|tonight)|legal action|warrant of arrest|you (?:will|go) be arrested|prosecut\w+|(?:be|get) (?:decamped|disqualified|delisted|blacklisted|deactivated)|lose your (?:slot|admission|place|account))\b/,
    ]),
  },
  {
    id: 'pressure-words',
    severity: 'low',
    test: ({ text }) => firstMatch(text, [/\b(?:urgent(?:ly)?|immediately|asap|act now|right now|now now|hurry|limited (?:slots?|stock|offer)|very limited|few slots|first come,? first serve\w*|before (?:price increase|slots? finish|it finish))\b/]),
  },
  {
    id: 'too-good-prize',
    severity: 'medium',
    test: ({ text }) => firstMatch(text, [
      /\b(?:you(?:'ve| have)? (?:won|been selected|been chosen|emerged)|lucky (?:winner|customer|draw)|winner of|promo winner|giveaway|claim your (?:prize|reward|gift|bonus|winnings|cash)|free (?:data|airtime|recharge|laptop|phone|money|cash|gift|iphone)|you don win|you win (?:₦|n|\d))\b/,
      /\bcongrat\w*\b[^.!?\n]{0,60}\b(?:selected|won|winner|prize|reward|shortlisted|approved|qualified|beneficiar\w*|lucky)\b/,
    ]),
  },
  {
    id: 'easy-money',
    severity: 'high',
    test: ({ text }) => firstMatch(text, [
      /\b(?:guaranteed? (?:returns?|profits?|income|payouts?|interest)|double your (?:money|investment|cash)|risk[- ]free|no risk|100% (?:guaranteed|profit|safe))\b/,
      /\b\d{1,3}\s?%\s?(?:profit|returns?|interest|roi|bonus)?\s?(?:daily|weekly|monthly|every (?:day|week|24 hours)|per (?:day|week)|roi)\b/,
      /\b(?:withdrawal|withdraw|payout) every \d+ ?(?:hours?|hrs|days?)\b/,
      new RegExp(String.raw`\b(?:earn|make|get)\s+(?:up to\s+)?${AMOUNT}\s+(?:daily|weekly|per day|every day|a day|each day|per week|every week)\b`),
      new RegExp(String.raw`\binvest\s+${AMOUNT}[^.!?\n]{0,20}\b(?:get|earn|receive|collect|make)\s+${AMOUNT}`),
    ]),
  },
  {
    id: 'job-red-flags',
    severity: 'medium',
    test: ({ text }) => firstMatch(text, [
      /\b(?:no ielts(?: needed| required)?|visa (?:is )?guaranteed|guaranteed visa|no interview|without (?:an )?interview|no experience (?:needed|required)|no (?:cv|qualification)s? (?:needed|required)|work from home and earn|paid (?:to|for) (?:like|follow|subscribe|review|watch)\w*|daily tasks? (?:and|to) earn|simple tasks?|start (?:work|earning) (?:today|immediately))\b/,
      /\b(?:like|follow|subscribe|review|rate)\w*\s+(?:and|to|&)\s+(?:earn|get paid|make money)\b/,
    ]),
  },
  {
    id: 'new-number',
    severity: 'low',
    test: ({ text }) => firstMatch(text, [
      /\b(?:this is my new (?:number|line|whatsapp)|(?:i(?:'ve| have)?|i don|don) (?:changed?|change) (?:my )?(?:number|line|phone|sim)|na my new (?:number|line)|my (?:phone|line|sim) (?:got |was |don |is )?(?:stolen|spoilt|spoil|bad|damaged|lost|missing)|save (?:this|my new) (?:number|line))\b/,
    ]),
  },
  {
    id: 'emergency',
    severity: 'low',
    hidden: true, // used only in combination below
    test: ({ text }) => firstMatch(text, [/\b(?:stranded|hospital|accident|emergency|arrested|police station|kidnap\w*|stuck at|in trouble|surgery|admitted|robbed|hijacked)\b/]),
  },
  {
    id: 'secrecy',
    severity: 'medium',
    test: ({ text }) => firstMatch(text, [
      /\b(?:(?:don'?t|do not|no) tell (?:anyone|anybody|nobody|your (?:family|parents|bank|husband|wife))|keep (?:this|it) (?:secret|confidential|private|between us)|between (?:you and me|you and i))\b/,
    ]),
  },
  {
    id: 'unusual-payment',
    severity: 'high',
    test: ({ text }) => firstMatch(text, [
      /\b(?:pay|send|buy|payment|transfer|deposit)\b[^.!?\n]{0,40}\b(?:gift ?cards?|itunes|apple (?:gift )?cards?|steam (?:cards?|wallet)|google play cards?|amazon cards?|bitcoin|btc|usdt|crypto(?:currency)?|binance|bybit)\b/,
      /\b(?:gift ?cards?|itunes cards?|usdt|bitcoin)\b[^.!?\n]{0,30}\b(?:as payment|to pay|for payment)\b/,
    ]),
  },
  {
    id: 'wrong-transfer',
    severity: 'high',
    test: ({ text }) => firstMatch(text, [
      /\b(?:mistakenly|by mistake|in error|wrongly|erroneously)\b[^.!?\n]{0,40}\b(?:sent|transferred|credited|paid|send|transfer|recharged|loaded|topped up)\b/,
      /\b(?:sent|transferred|credited|paid|send|transfer)\b[^.!?\n]{0,40}\b(?:by mistake|in error|mistakenly|wrongly|erroneously)\b/,
      /\bwrong (?:transfer|account|alert)\b/,
    ]),
  },
  {
    id: 'delivery-hold',
    severity: 'medium',
    test: ({ text }) => firstMatch(text, [
      /\b(?:package|parcel|consignment|shipment|goods|item|delivery|box)\b[^.!?\n]{0,60}\b(?:held|seized|on hold|awaiting (?:payment|clearance)|stuck|detained|at (?:the )?customs|could not be delivered|failed delivery|undeliver\w*)\b/,
      /\bcustoms? (?:duty|clearance|fees?|charges?)\b/,
    ]),
  },
  {
    id: 'grant-offer',
    severity: 'medium',
    test: ({ text, flags }) => (flags.grant || /\bfree (?:loan|money)\b/.test(text)) && firstMatch(text, [
      /\b(?:apply|register|claim|click|qualif\w+|eligible|benefit\w*|selected|approved|receive|collect|disburs\w*|link)\b/,
    ]) && firstMatch(text, [CONTEXT.grant, /\bfree (?:loan|money)\b/]),
  },
  {
    id: 'loan-offer',
    severity: 'medium',
    test: ({ text }) => firstMatch(text, [
      /\b(?:instant|quick|fast|easy|urgent) loans?\b/,
      /\bloan (?:has been |is |don )?approved\b/,
      /\b(?:no|without) collateral\b/,
      new RegExp(String.raw`\bloans? of ${AMOUNT}`),
      /\binterest[- ]free loans?\b/,
    ]),
  },
  {
    id: 'investment-scheme',
    severity: 'high',
    test: ({ text }) => firstMatch(text, [
      /\b(?:forex|crypto(?:currency)?|bitcoin|binary options?)\s+(?:trading|investment|mining|signals?|platform)\b/,
      /\b(?:account manager|trading platform|contribution (?:scheme|group)|refer (?:and|&) earn|refer your friends|downlines?|invest (?:with us|now)|cbex|mmm|ponzi|investment app)\b/,
      /\b(?:forex|crypto|bitcoin|binary) (?:trader|expert|mentor|signals?)\b|\btrade (?:it|am|the money|your money) for you\b/,
    ]),
  },
  {
    id: 'inheritance-419',
    severity: 'high',
    test: ({ text }) => firstMatch(text, [
      /\b(?:next of kin|inheritance|unclaimed (?:funds?|money|package|consignment)|beneficiary of (?:the |a )?(?:fund|estate|will)|diplomat(?:ic)? (?:agent|bag)|consignment box|compensation fund|trunk box|foreign beneficiary|late (?:client|husband|father) (?:left|deposited))\b/,
    ]),
  },
  {
    // A transfer receipt or alert screenshot. Fake receipt apps make perfect
    // copies, so the only proof is the person's own bank balance.
    id: 'payment-receipt',
    severity: 'medium',
    test: ({ text }) => {
      const hits = RECEIPT_MARKERS.filter((re) => re.test(text));
      return hits.length >= 3 ? firstMatch(text, hits) : null;
    },
  },
  {
    // "MacBook M1 Pro brand new for 600k". We can't know market prices, but an
    // expensive gadget being sold with a price is exactly where fake vendors
    // operate, so prompt the person to compare before paying.
    id: 'gadget-deal',
    severity: 'medium',
    test: ({ text }) => GADGET_RE.test(text) && SELLING_RE.test(text) && AMOUNT_RE.test(text)
      && firstMatch(text, [GADGET_RE]),
  },
  {
    // "Plot of land in Ogun for 10k". See prices.js for the (deliberately low) floors.
    id: 'too-cheap',
    severity: 'high',
    test: ({ text }) => {
      const offer = tooCheapOffer(text);
      if (!offer) return null;
      return {
        evidence: formatNaira(offer.price),
        severity: offer.severity,
        vars: { item: offer.item, price: formatNaira(offer.price), floor: formatNaira(offer.floor), itemId: offer.id },
      };
    },
  },
  {
    // Paying before you've seen the goods, room or land: the core of vendor scams.
    id: 'pay-first',
    severity: 'medium',
    test: ({ text }) => firstMatch(text, [
      /\b(?:payment|pay)\s+(?:before|b4)\s+(?:delivery|dispatch|inspection|viewing)\b/,
      /\bpay\b[^.!?\n]{0,60}\bbefore (?:we |you |i |dem )?(?:go|come|see|view|inspect|visit|meet)\b/,
      /\bpay\b[^.!?\n]{0,20}\bto confirm (?:your |the )?order\b/,
      /\bpay (?:now|first) (?:and|then|before)\b[^.!?\n]{0,30}\b(?:deliver|dispatch|send)\w*/,
      /\b(?:pay|send)\b[^.!?\n]{0,40}\bthen (?:i|we) (?:dispatch|deliver|send|ship)\b/,
      /\binspection fee\b/,
    ]),
  },
  {
    // "Credit alert… kindly release the goods": payment claimed, goods requested.
    id: 'release-goods',
    severity: 'high',
    test: ({ text }) => /\b(?:credit alert|credited|i have (?:paid|sent|transferred)|payment (?:has been |is )?(?:made|sent|successful)|transfer (?:has been )?(?:made|sent))\b/.test(text)
      && firstMatch(text, [/\b(?:release|hand over|give|send|dispatch|deliver)\b[^.!?\n]{0,25}\b(?:the |my )?(?:goods|items?|products?|car|phone|order|package|parcel)\b/]),
  },
  {
    // JAMB/WAEC/NECO "upgrades" are always fraud.
    id: 'result-upgrade',
    severity: 'critical',
    test: ({ text }) => firstMatch(text, [
      /\b(?:upgrade|increase|change|boost|raise)\b[^.!?\n]{0,30}\b(?:score|result|grade|cgpa)s?\b/,
      /\b(?:jamb|waec|neco|gce|utme|score|result)\s+upgrade\b/,
    ]),
  },
  {
    // Fake "recovery agents" target people who were already scammed.
    id: 'recovery-scam',
    severity: 'high',
    test: ({ text }) => /\b(?:scam\w*|lost|stolen|hack\w*|fraud\w*)\b/.test(text)
      && firstMatch(text, [
        /\b(?:recover(?:y)?|retrieve)\b[^.!?\n]{0,40}\b(?:funds?|money|crypto|bitcoin|investment|agents?|experts?)\b/,
        /\bget (?:your |the )?(?:funds?|money|crypto) back\b/,
      ]),
  },
  {
    // "Nigeria Customs auction: Camry for 450k"
    id: 'customs-auction',
    severity: 'high',
    test: ({ text }) => firstMatch(text, [
      /\bcustoms?\b[^.!?\n]{0,20}\b(?:auction\w*|seized (?:cars?|vehicles?|goods))\b/,
      /\bauction(?:ed)? (?:cars?|vehicles?)\b/,
    ]),
  },
  {
    // Heart-string appeals for donations to personal accounts.
    id: 'donation-appeal',
    severity: 'medium',
    test: ({ text }) => /\b(?:donate|donation|help save|save (?:baby|the life)|surgery|treatment abroad|medical bills?)\b/.test(text)
      && firstMatch(text, [/\b(?:send|donate|transfer|pay)\b[^.!?\n]{0,60}\b(?:to|into)\b[^.!?\n]{0,15}(?:\d{10}|\bthis account\b|\bmy account\b|\baccount\b)/]),
  },
  {
    // Romance: "my love… customs want 300k… send it". Counted with a money request in analyze.js.
    id: 'romance',
    severity: 'low',
    hidden: true,
    test: ({ text }) => firstMatch(text, [/\b(?:my love|my darling|sweetheart|my heart|baby girl|my queen|my king|honey)\b/]),
  },
  {
    id: 'generic-greeting',
    severity: 'low',
    test: ({ text }) => firstMatch(text, [
      /\bdear (?:valued |esteemed )?(?:customer|user|client|account ?holder|subscriber|beneficiary|applicant|winner|sir\/?(?:ma|madam)|member)\b/,
    ]),
  },
  {
    id: 'chat-app-redirect',
    severity: 'medium',
    test: ({ text, flags }) => (flags.job || flags.grant || flags.prize || flags.investment || flags.loan || flags.govt) && firstMatch(text, [
      /\b(?:chat|contact|message|text|reach|dm|call|apply|register|join)\b[^.!?\n]{0,40}\b(?:on|via|through|with)\b[^.!?\n]{0,15}\b(?:whatsapp|telegram|signal)\b/,
      /\bjoin (?:our|the|my) (?:whatsapp|telegram) (?:group|channel)\b/,
    ]),
  },
  {
    id: 'click-to-verify',
    severity: 'medium',
    test: ({ text }) => firstMatch(text, [
      /\b(?:click|tap|visit|follow|open|use)\b[^.!?\n]{0,30}\b(?:link|here|below|url|website|portal)\b[^.!?\n]{0,40}\b(?:verify|update|confirm|unblock|reactivate|restore|claim|login|log in|sign in|validate|unlock|activate|redeem|avoid)\b/,
      /\b(?:verify|update|confirm|unblock|reactivate|claim|validate|unlock|redeem|activate)\b[^.!?\n]{0,40}\b(?:via|using|through|with|at|on)\s+(?:the |this )?(?:link|url|portal)\b/,
    ]),
  },
];

export function buildFlags(text) {
  const flags = {};
  for (const [k, re] of Object.entries(CONTEXT)) flags[k] = re.test(text);
  return flags;
}

// Every replacement is one character for one character, so match positions in
// the normalised text line up with the original (used to quote evidence as typed).
export function normalizeText(raw) {
  return String(raw || '')
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u00a0\t]/g, ' ')
    .toLowerCase();
}
