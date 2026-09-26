// Official websites of organisations scammers commonly pretend to be in Nigeria.
//
// ACCURACY MATTERS MORE THAN SIZE HERE. A wrong entry makes CheckAm vouch for a
// scam site. Before adding or changing a domain, confirm it on at least two
// independent sources (the organisation's verified social accounts, printed
// statements, the app store listing's developer website, CBN/SEC/NCC lists).
//
// Fields:
//   name        Shown to users.
//   type        bank | fintech | telco | government | exam | courier | shop | platform
//   domains     Registrable domains the organisation owns. Subdomains count too.
//   mentions    Lowercase phrases that mean "this message claims to be from them".
//   keywords    Tokens that, found inside some OTHER website's name, suggest a fake.
//               Short ones (< 6 letters) only match at the start of a word.

export const ORGS = [
  // Banks
  { id: 'gtbank', name: 'GTBank', type: 'bank', domains: ['gtbank.com', 'gtco.com'], mentions: ['gtbank', 'gt bank', 'gtco', 'guaranty trust'], keywords: ['gtbank', 'gtco', 'guarantytrust'] },
  { id: 'access', name: 'Access Bank', type: 'bank', domains: ['accessbankplc.com'], mentions: ['access bank', 'accessbank'], keywords: ['accessbank'] },
  { id: 'zenith', name: 'Zenith Bank', type: 'bank', domains: ['zenithbank.com'], mentions: ['zenith bank', 'zenithbank', 'zenith'], keywords: ['zenithbank', 'zenith'] },
  { id: 'firstbank', name: 'First Bank', type: 'bank', domains: ['firstbanknigeria.com'], mentions: ['first bank', 'firstbank'], keywords: ['firstbank'] },
  { id: 'uba', name: 'UBA', type: 'bank', domains: ['ubagroup.com'], mentions: ['uba', 'united bank for africa'], keywords: ['uba', 'ubagroup'] },
  { id: 'fidelity', name: 'Fidelity Bank', type: 'bank', domains: ['fidelitybank.ng'], mentions: ['fidelity bank'], keywords: ['fidelitybank'] },
  { id: 'union', name: 'Union Bank', type: 'bank', domains: ['unionbankng.com'], mentions: ['union bank'], keywords: ['unionbank'] },
  { id: 'sterling', name: 'Sterling Bank', type: 'bank', domains: ['sterling.ng'], mentions: ['sterling bank'], keywords: ['sterlingbank'] },
  { id: 'wema', name: 'Wema Bank / ALAT', type: 'bank', domains: ['wemabank.com', 'alat.ng'], mentions: ['wema bank', 'wema', 'alat'], keywords: ['wemabank', 'wema', 'alat'] },
  { id: 'stanbic', name: 'Stanbic IBTC', type: 'bank', domains: ['stanbicibtcbank.com', 'stanbicibtc.com'], mentions: ['stanbic', 'stanbic ibtc'], keywords: ['stanbic'] },
  { id: 'fcmb', name: 'FCMB', type: 'bank', domains: ['fcmb.com'], mentions: ['fcmb', 'first city monument'], keywords: ['fcmb'] },
  { id: 'ecobank', name: 'Ecobank', type: 'bank', domains: ['ecobank.com'], mentions: ['ecobank'], keywords: ['ecobank'] },
  { id: 'polaris', name: 'Polaris Bank', type: 'bank', domains: ['polarisbanklimited.com'], mentions: ['polaris bank'], keywords: ['polarisbank'] },
  { id: 'keystone', name: 'Keystone Bank', type: 'bank', domains: ['keystonebankng.com'], mentions: ['keystone bank'], keywords: ['keystonebank'] },
  { id: 'providus', name: 'Providus Bank', type: 'bank', domains: ['providusbank.com'], mentions: ['providus'], keywords: ['providus'] },

  // Fintechs / mobile money
  { id: 'opay', name: 'OPay', type: 'fintech', domains: ['opayweb.com'], mentions: ['opay'], keywords: ['opay'] },
  { id: 'palmpay', name: 'PalmPay', type: 'fintech', domains: ['palmpay.com'], mentions: ['palmpay', 'palm pay'], keywords: ['palmpay'] },
  { id: 'moniepoint', name: 'Moniepoint', type: 'fintech', domains: ['moniepoint.com'], mentions: ['moniepoint'], keywords: ['moniepoint'] },
  { id: 'kuda', name: 'Kuda', type: 'fintech', domains: ['kuda.com'], mentions: ['kuda'], keywords: ['kuda'] },
  { id: 'paystack', name: 'Paystack', type: 'fintech', domains: ['paystack.com', 'paystack.co'], mentions: ['paystack'], keywords: ['paystack'] },
  { id: 'flutterwave', name: 'Flutterwave', type: 'fintech', domains: ['flutterwave.com'], mentions: ['flutterwave'], keywords: ['flutterwave'] },
  { id: 'piggyvest', name: 'PiggyVest', type: 'fintech', domains: ['piggyvest.com'], mentions: ['piggyvest'], keywords: ['piggyvest'] },
  { id: 'cowrywise', name: 'Cowrywise', type: 'fintech', domains: ['cowrywise.com'], mentions: ['cowrywise'], keywords: ['cowrywise'] },

  // Telcos
  { id: 'mtn', name: 'MTN', type: 'telco', domains: ['mtn.ng', 'mtnonline.com', 'mtn.com'], mentions: ['mtn'], keywords: ['mtn'] },
  { id: 'airtel', name: 'Airtel', type: 'telco', domains: ['airtel.com.ng', 'airtel.africa'], mentions: ['airtel'], keywords: ['airtel'] },
  { id: 'glo', name: 'Glo', type: 'telco', domains: ['gloworld.com'], mentions: ['glo', 'globacom'], keywords: ['gloworld', 'globacom'] },
  { id: '9mobile', name: '9mobile', type: 'telco', domains: ['9mobile.com.ng'], mentions: ['9mobile'], keywords: ['9mobile'] },

  // Government & regulators (every *.gov.ng is also treated as government)
  { id: 'cbn', name: 'Central Bank of Nigeria (CBN)', type: 'government', domains: ['cbn.gov.ng'], mentions: ['cbn', 'central bank of nigeria', 'central bank'], keywords: ['cbn'] },
  { id: 'efcc', name: 'EFCC', type: 'government', domains: ['efcc.gov.ng'], mentions: ['efcc'], keywords: ['efcc'] },
  { id: 'nimc', name: 'NIMC', type: 'government', domains: ['nimc.gov.ng'], mentions: ['nimc'], keywords: ['nimc'] },
  { id: 'ncc', name: 'NCC', type: 'government', domains: ['ncc.gov.ng'], mentions: ['nigerian communications commission'], keywords: [] },
  { id: 'jamb', name: 'JAMB', type: 'exam', domains: ['jamb.gov.ng'], mentions: ['jamb'], keywords: ['jamb'] },
  { id: 'nysc', name: 'NYSC', type: 'government', domains: ['nysc.gov.ng'], mentions: ['nysc', 'corps member', 'corper'], keywords: ['nysc'] },
  { id: 'waec', name: 'WAEC', type: 'exam', domains: ['waecnigeria.org', 'waecdirect.org'], mentions: ['waec'], keywords: ['waec'] },
  { id: 'neco', name: 'NECO', type: 'exam', domains: ['neco.gov.ng'], mentions: ['neco'], keywords: ['neco'] },
  { id: 'npower', name: 'N-Power', type: 'government', domains: ['npower.gov.ng'], mentions: ['npower', 'n-power', 'n power'], keywords: ['npower'] },
  { id: 'nelfund', name: 'NELFUND (student loans)', type: 'government', domains: ['nelf.gov.ng'], mentions: ['nelfund', 'student loan'], keywords: ['nelfund', 'nelf'] },
  { id: 'firs', name: 'FIRS', type: 'government', domains: ['firs.gov.ng'], mentions: ['firs'], keywords: ['firs'] },
  { id: 'sec', name: 'SEC Nigeria', type: 'government', domains: ['sec.gov.ng'], mentions: ['securities and exchange commission'], keywords: [] },
  { id: 'fccpc', name: 'FCCPC', type: 'government', domains: ['fccpc.gov.ng'], mentions: ['fccpc'], keywords: ['fccpc'] },
  { id: 'immigration', name: 'Nigeria Immigration Service', type: 'government', domains: ['immigration.gov.ng'], mentions: ['immigration service', 'nis passport'], keywords: [] },
  { id: 'customs', name: 'Nigeria Customs Service', type: 'government', domains: ['customs.gov.ng'], mentions: ['nigeria customs', 'customs service'], keywords: [] },
  { id: 'police', name: 'Nigeria Police Force', type: 'government', domains: ['npf.gov.ng'], mentions: ['nigeria police', 'police force'], keywords: [] },
  { id: 'nipost', name: 'NIPOST', type: 'courier', domains: ['nipost.gov.ng'], mentions: ['nipost'], keywords: ['nipost'] },

  // Couriers & shopping
  { id: 'dhl', name: 'DHL', type: 'courier', domains: ['dhl.com'], mentions: ['dhl'], keywords: ['dhl'] },
  { id: 'gig', name: 'GIG Logistics', type: 'courier', domains: ['giglogistics.com'], mentions: ['gig logistics', 'gigl'], keywords: ['giglogistics'] },
  { id: 'jumia', name: 'Jumia', type: 'shop', domains: ['jumia.com.ng', 'jumia.com'], mentions: ['jumia'], keywords: ['jumia'] },
  { id: 'konga', name: 'Konga', type: 'shop', domains: ['konga.com'], mentions: ['konga'], keywords: ['konga'] },

  // Global platforms people get phished for
  { id: 'whatsapp', name: 'WhatsApp', type: 'platform', domains: ['whatsapp.com'], mentions: [], keywords: ['whatsapp'] },
  { id: 'facebook', name: 'Facebook', type: 'platform', domains: ['facebook.com', 'fb.com', 'meta.com'], mentions: [], keywords: ['facebook'] },
  { id: 'instagram', name: 'Instagram', type: 'platform', domains: ['instagram.com'], mentions: [], keywords: ['instagram'] },
  { id: 'google', name: 'Google', type: 'platform', domains: ['google.com', 'youtube.com', 'youtu.be', 'google.com.ng'], mentions: [], keywords: [] },
  { id: 'apple', name: 'Apple', type: 'platform', domains: ['apple.com', 'icloud.com'], mentions: [], keywords: ['icloud'] },
  { id: 'microsoft', name: 'Microsoft', type: 'platform', domains: ['microsoft.com', 'live.com', 'office.com', 'outlook.com'], mentions: [], keywords: ['microsoft'] },
  { id: 'paypal', name: 'PayPal', type: 'platform', domains: ['paypal.com'], mentions: [], keywords: ['paypal'] },
  { id: 'netflix', name: 'Netflix', type: 'platform', domains: ['netflix.com'], mentions: [], keywords: ['netflix'] },
  { id: 'linkedin', name: 'LinkedIn', type: 'platform', domains: ['linkedin.com'], mentions: [], keywords: ['linkedin'] },
  { id: 'x', name: 'X (Twitter)', type: 'platform', domains: ['x.com', 'twitter.com'], mentions: [], keywords: [] },
  { id: 'tiktok', name: 'TikTok', type: 'platform', domains: ['tiktok.com'], mentions: [], keywords: [] },
];

// Links that open a chat with some phone number/account. Official domain, but it
// says nothing about who is on the other end.
export const CHAT_LINK_HOSTS = ['wa.me', 'chat.whatsapp.com', 'api.whatsapp.com', 't.me', 'telegram.me'];

// Official domains that host content anyone can create.
export const FORM_LINKS = [
  { host: 'forms.gle' },
  { host: 'docs.google.com', path: '/forms' },
  { host: 'forms.office.com' },
  { host: 'form.jotform.com' },
  { host: 'jotform.com' },
  { host: 'typeform.com' },
];

const byDomain = new Map();
for (const org of ORGS) for (const d of org.domains) byDomain.set(d, org);

/** The organisation that owns this registrable domain, if it's on our list. */
export function orgForDomain(registrable) {
  return byDomain.get(registrable) || null;
}

export function isGovNg(registrable) {
  return /\.gov\.ng$/.test(registrable || '');
}
