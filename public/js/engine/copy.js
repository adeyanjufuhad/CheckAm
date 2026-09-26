// Every explanation CheckAm shows, in English (en) and Nigerian Pidgin (pcm).
// Kept apart from the logic so a Pidgin speaker can review wording without
// touching code. {placeholders} are filled in by the engine.
//
// House rules for writing here:
//   - Say what we saw and why it matters. Never say something IS safe.
//   - Short sentences. Assume the reader is worried and reading on a small phone.

export const LEVELS = {
  danger: {
    headline: { en: 'Strong signs of a scam', pcm: 'E get strong sign say na scam' },
    sub: {
      en: "Don't pay, click or share any details. Check it yourself through an official channel first.",
      pcm: 'No pay, no click, no give anybody your details. Confirm am by yourself from the real place first.',
    },
  },
  caution: {
    headline: { en: 'Some warning signs', pcm: 'Some things no too correct' },
    sub: {
      en: 'Be careful. Confirm it through an official channel before you act.',
      pcm: 'Take am easy. Confirm am from the real company or person before you do anything.',
    },
  },
  unclear: {
    headline: { en: "No clear warning signs, but that doesn't mean it's safe", pcm: 'We no see clear scam sign, but e no mean say e safe' },
    sub: {
      en: "CheckAm can't confirm this is genuine. If it asks for money or your details, verify it yourself first.",
      pcm: 'CheckAm no fit confirm say e real. If dem ask for money or your details, confirm am by yourself first.',
    },
  },
};

export const FINDINGS = {
  // ---- Message text ----
  'upfront-fee': {
    title: { en: 'Asks you to pay a fee first', pcm: 'Dem wan make you pay money first' },
    why: {
      en: 'Real employers, grant schemes and prize draws do not charge you to receive something. Asking for a "processing", "registration" or "clearance" fee is the most common scam trick in Nigeria.',
      pcm: 'Real company, grant or promo no dey collect money before dem give you anything. "Processing fee", "registration fee", "clearance fee" na the commonest scam style for Naija.',
    },
  },
  'credential-request': {
    title: { en: 'Asks for your OTP, PIN, password or card details', pcm: 'Dem dey ask for your OTP, PIN, password or card details' },
    why: {
      en: 'No bank, telco or government office will ever ask you to send these. Anyone who has them can empty your account.',
      pcm: 'No bank, network or government office go ever ask you make you send these things. Anybody wey get am fit clear your account.',
    },
  },
  'id-request': {
    title: { en: 'Asks for your BVN or NIN', pcm: 'Dem dey ask for your BVN or NIN' },
    why: {
      en: 'Your BVN and NIN can be used to open loans or accounts in your name. Only give them through official apps or in person at the bank or NIMC office.',
      pcm: 'Person fit use your BVN or NIN take loan or open account for your name. Only give am for official app, or for bank or NIMC office face-to-face.',
    },
  },
  'threat-urgency': {
    title: { en: 'Threatens you or sets a deadline', pcm: 'Dem dey threaten you or rush you with time' },
    why: {
      en: "Scammers say your account will be blocked or give you a short deadline so you panic and don't stop to check.",
      pcm: 'Scammers go talk say dem go block your account or give you small time, so you go fear and no get chance to check.',
    },
  },
  'pressure-words': {
    title: { en: 'Pushes you to act fast', pcm: 'Dem dey rush you' },
    why: {
      en: 'Words like "urgent" or "immediately" are meant to stop you thinking. A genuine request can wait for you to check.',
      pcm: 'Words like "urgent" or "now now" na to stop you from think. Correct request fit wait make you confirm.',
    },
  },
  'too-good-prize': {
    title: { en: 'Says you won something or were selected', pcm: 'Dem talk say you don win or dem select you' },
    why: {
      en: "If you didn't enter a draw or apply, you can't have won it. Fake prizes are used to collect fees or your details.",
      pcm: 'If you no enter any promo or apply, how you take win? Na fake prize dem dey use collect money or your details.',
    },
  },
  'easy-money': {
    title: { en: 'Promises big or guaranteed returns', pcm: 'Dem promise big profit wey sure' },
    why: {
      en: 'No real investment can guarantee high daily or weekly profits. This is how Ponzi schemes attract people before they collapse.',
      pcm: 'No correct investment fit guarantee big profit every day or every week. Na so Ponzi dey pull people before e crash.',
    },
  },
  'job-red-flags': {
    title: { en: 'Job offer that sounds too easy', pcm: 'Job offer wey too easy' },
    why: {
      en: 'Real jobs involve applications and interviews. "No interview", "like and earn" or "chat HR on WhatsApp" are common signs of fake jobs.',
      pcm: 'Real job get application and interview. "No interview", "like and earn" or "chat HR for WhatsApp" na common sign of fake job.',
    },
  },
  'new-number-money': {
    title: { en: 'A "familiar" person on a new number asking for money', pcm: 'Person wey you "know" dey use new number ask for money' },
    why: {
      en: 'Scammers copy the name and photo of someone you know, say they changed their number, then ask for urgent money.',
      pcm: 'Scammers go copy name and picture of person wey you know, talk say dem change number, then ask for urgent money.',
    },
  },
  'new-number': {
    title: { en: 'Claims to be someone you know, on a new number', pcm: 'Dem talk say na person wey you know, with new number' },
    why: {
      en: 'Anyone can put a friend\'s name and photo on a new WhatsApp number. Confirm on their old number before trusting it.',
      pcm: 'Anybody fit put your person name and picture for new WhatsApp number. Call the old number confirm first.',
    },
  },
  'emergency-money': {
    title: { en: 'Emergency story with a request for money', pcm: 'Emergency story and dem dey ask for money' },
    why: {
      en: 'Stories about hospitals, accidents, arrests or being stranded are used to make you send money before you think.',
      pcm: 'Story of hospital, accident, police or "I dey stranded" na to make you send money before you reason am.',
    },
  },
  secrecy: {
    title: { en: 'Asks you to keep it secret', pcm: 'Dem say make you no tell anybody' },
    why: {
      en: 'Scammers want to stop you from asking family, friends or your bank, who would spot the trick.',
      pcm: 'Scammers no want make you ask family, friends or your bank, because dem go catch the trick.',
    },
  },
  'unusual-payment': {
    title: { en: 'Wants payment in gift cards or crypto', pcm: 'Dem want make you pay with gift card or crypto' },
    why: {
      en: "Gift cards and crypto are hard to trace or reverse. Real businesses and government offices don't ask for them.",
      pcm: 'Gift card and crypto hard to trace and you no fit reverse am. Real company or government no dey ask for am.',
    },
  },
  'personal-account-payment': {
    title: { en: 'Asks you to pay into an account number', pcm: 'Dem give you account number make you pay' },
    why: {
      en: 'Before you pay, check the account name your bank shows. A personal name for a "company" payment is a red flag, but even a matching name does not prove it is genuine.',
      pcm: 'Before you pay, check the account name wey your bank show. If na person name for "company" payment, e no correct. Even if name match, e no mean say e real.',
    },
  },
  'wrong-transfer': {
    title: { en: 'Says money was sent to you "by mistake"', pcm: 'Dem say dem send money enter your account "by mistake"' },
    why: {
      en: 'A common trick: a fake credit alert, then a request to "send it back". Check your balance in your bank app, not the SMS or screenshot.',
      pcm: 'Common trick: dem go send fake alert, then beg make you "return am". Check your balance for your bank app, no be SMS or screenshot.',
    },
  },
  'delivery-hold': {
    title: { en: 'Says a parcel is held until you pay', pcm: 'Dem say your parcel hook until you pay' },
    why: {
      en: 'Fake courier and customs messages ask for small "clearance" fees. Track parcels only on the courier\'s official website or app.',
      pcm: 'Fake delivery and customs message dey ask for small "clearance" fee. Track your parcel only for the courier real website or app.',
    },
  },
  'grant-offer': {
    title: { en: 'Grant, scholarship or government money offer', pcm: 'Grant, scholarship or government money offer' },
    why: {
      en: 'Scammers copy real programmes (N-Power, CBN, FG grants, scholarships). Real ones are announced on official .gov.ng websites and never charge fees.',
      pcm: 'Scammers dey copy real programmes (N-Power, CBN, FG grant, scholarship). The real ones dey for official .gov.ng website and dem no dey collect fee.',
    },
  },
  'loan-offer': {
    title: { en: 'Instant loan offer', pcm: 'Quick loan offer' },
    why: {
      en: 'Fake lenders ask for an "insurance" or "processing" fee before paying out. Use lenders on the FCCPC approved list.',
      pcm: 'Fake loan people go ask for "insurance" or "processing" fee before dem pay. Use only lenders wey FCCPC approve.',
    },
  },
  'investment-scheme': {
    title: { en: 'Investment or trading scheme', pcm: 'Investment or trading scheme' },
    why: {
      en: 'Forex/crypto "account managers", refer-and-earn and contribution schemes are how many Nigerians lost money in collapses like CBEX. Check registration with SEC Nigeria.',
      pcm: 'Forex/crypto "account manager", refer-and-earn and contribution scheme na how plenty people lose money for things like CBEX. Check if SEC Nigeria register dem.',
    },
  },
  'inheritance-419': {
    title: { en: 'Inheritance, next-of-kin or "unclaimed funds" story', pcm: 'Inheritance, next of kin or "unclaimed money" story' },
    why: {
      en: 'This is the classic 419 script. There is no stranger\'s fortune waiting for you.',
      pcm: 'Na the old 419 script be this. No stranger money dey wait for you anywhere.',
    },
  },
  'generic-greeting': {
    title: { en: 'Generic greeting like "Dear customer"', pcm: 'Dem no call your name, na "Dear customer"' },
    why: {
      en: 'Not proof on its own, but mass scam messages often don\'t know your name.',
      pcm: 'E no be proof by itself, but scam message wey dem send to plenty people no dey know your name.',
    },
  },
  'chat-app-redirect': {
    title: { en: 'Moves the conversation to WhatsApp or Telegram', pcm: 'Dem want make una continue for WhatsApp or Telegram' },
    why: {
      en: 'Organisations usually use official emails, websites or apps. Moving you to a private chat avoids records and checks.',
      pcm: 'Correct company dey use official email, website or app. If dem carry you go private chat, na to hide from record and check.',
    },
  },
  'click-to-verify': {
    title: { en: 'Asks you to click a link to verify, unblock or claim', pcm: 'Dem say make you click link to verify, unblock or claim' },
    why: {
      en: 'Fake links lead to copy-cat login pages that steal your details. Open the official app or type the website yourself instead.',
      pcm: 'Fake link dey carry you go fake login page wey go steal your details. Open the real app or type the website by yourself.',
    },
  },
  'free-email-sender': {
    title: { en: 'Organisation using a free email address', pcm: 'Company dey use free email address' },
    why: {
      en: 'Real companies and government offices usually email from their own domain, not Gmail or Yahoo ({email}).',
      pcm: 'Real company and government office dey use their own email, no be Gmail or Yahoo ({email}).',
    },
  },

  // ---- Links ----
  'brand-link-mismatch': {
    title: { en: 'Link does not go to {org}\'s website', pcm: 'The link no be {org} website' },
    why: {
      en: 'The message mentions {org}, but the link goes to {domain}. {org}\'s official website is {official}.',
      pcm: 'The message mention {org}, but the link dey go {domain}. {org} real website na {official}.',
    },
  },
  'govt-non-govng': {
    title: { en: 'Government offer, but not a .gov.ng website', pcm: 'Government offer, but the website no be .gov.ng' },
    why: {
      en: 'Official Nigerian government websites normally end in .gov.ng. This link goes to {domain}.',
      pcm: 'Real Naija government website dey end with .gov.ng. This link dey go {domain}.',
    },
  },
  'lookalike-domain': {
    title: { en: 'Fake-looking website name', pcm: 'The website name dey form like {org} own' },
    why: {
      en: '{domain} uses the name "{org}" but is not {org}\'s website ({official}). Anyone can register a name like this.',
      pcm: '{domain} carry "{org}" name but e no be {org} website ({official}). Anybody fit register name like this.',
    },
  },
  'typosquat-domain': {
    title: { en: 'Website name is a misspelling of {org}', pcm: 'Website name na {org} name wey dem spell wrong' },
    why: {
      en: '{domain} looks almost like {official}, but it is a different website. Scammers use small spelling changes to fool people.',
      pcm: '{domain} resemble {official}, but na different website. Scammers dey change one or two letters to fool people.',
    },
  },
  'ip-link': {
    title: { en: 'Link uses a number instead of a website name', pcm: 'The link na number, no be website name' },
    why: {
      en: 'Real organisations use named websites. Links like {domain} are often used to hide who runs the site.',
      pcm: 'Real company dey use website name. Link like {domain} na to hide who get the site.',
    },
  },
  'punycode-link': {
    title: { en: 'Website name uses disguised characters', pcm: 'The website name get hidden strange letters' },
    why: {
      en: '{domain} contains special characters that can make a fake website look like a real one.',
      pcm: '{domain} get special letters wey fit make fake website resemble real one.',
    },
  },
  'at-sign-link': {
    title: { en: 'Link is disguised with an "@" sign', pcm: 'Dem use "@" hide where the link dey go' },
    why: {
      en: 'Everything before the "@" is ignored. This link really goes to {domain}.',
      pcm: 'Anything wey dey before "@" no count. This link dey really go {domain}.',
    },
  },
  'shortened-link': {
    title: { en: 'Shortened link hides where it goes', pcm: 'Short link dey hide where e dey go' },
    why: {
      en: '{domain} links can point anywhere. Scammers use them to hide fake websites.',
      pcm: '{domain} link fit carry you go anywhere. Scammers dey use am hide fake website.',
    },
  },
  'free-hosting': {
    title: { en: 'Free website that anyone can create', pcm: 'Free website wey anybody fit create' },
    why: {
      en: '{domain} is on {platform}, where anyone can make a site in minutes. Banks and government agencies don\'t use these.',
      pcm: '{domain} dey on top {platform}, where anybody fit make website quick quick. Bank and government no dey use am.',
    },
  },
  'form-link': {
    title: { en: 'Link opens an online form', pcm: 'The link na online form' },
    why: {
      en: 'Anyone can make a form like this. Never type passwords, PINs, BVN or bank details into one.',
      pcm: 'Anybody fit make this kind form. No ever type password, PIN, BVN or bank details inside am.',
    },
  },
  'chat-link': {
    title: { en: 'Link opens a private chat', pcm: 'The link go open private chat' },
    why: {
      en: 'This opens a WhatsApp or Telegram chat with some number or account. It tells you nothing about who is on the other end.',
      pcm: 'E go open WhatsApp or Telegram chat with one number or account. E no tell you who dey the other side.',
    },
  },
  'risky-tld': {
    title: { en: 'Unusual website ending (.{tld})', pcm: 'The website end with strange something (.{tld})' },
    why: {
      en: 'Endings like .{tld} are cheap and often used for short-lived scam sites. Not proof on its own.',
      pcm: 'Ending like .{tld} cheap well well and scammers dey use am for quick scam site. E no be proof by itself.',
    },
  },
  'no-https': {
    title: { en: 'Link is not secure (http)', pcm: 'The link no secure (http)' },
    why: {
      en: 'Anything you type on an "http://" page can be seen by others. Never enter details on one.',
      pcm: 'Anything you type for "http://" page, other people fit see am. No enter your details there.',
    },
  },
  'sensitive-path': {
    title: { en: 'Login-style link on an unknown website', pcm: 'Login-style link for website wey we no know' },
    why: {
      en: 'The link to {domain} contains words like "login", "verify" or "BVN". Fake pages copy real login screens to steal details.',
      pcm: 'The link to {domain} get words like "login", "verify" or "BVN". Fake page dey copy real login page to steal details.',
    },
  },
  'deep-subdomain': {
    title: { en: 'Website name is padded with extra words', pcm: 'Dem add plenty extra words for the website name' },
    why: {
      en: 'The real website here is {domain}. Everything in front of it can be made up to look official.',
      pcm: 'The real website na {domain}. Anything wey dey in front, dem fit make am up so e go look official.',
    },
  },

  // ---- Online checks ----
  'new-domain': {
    title: { en: 'Website is brand new', pcm: 'The website just start' },
    why: {
      en: '{domain} was registered only {days} days ago. Scam websites are usually new and disappear quickly.',
      pcm: 'Dem register {domain} only {days} days ago. Scam website dey usually new and e go disappear quick.',
    },
  },
  'young-domain': {
    title: { en: 'Website is only a few months old', pcm: 'The website never reach one year' },
    why: {
      en: '{domain} was registered {days} days ago. Not proof, but established organisations usually have older websites.',
      pcm: 'Dem register {domain} {days} days ago. E no be proof, but big company website dey usually old.',
    },
  },
  'safe-browsing-listed': {
    title: { en: 'Google flags this link as dangerous', pcm: 'Google don mark this link say e dangerous' },
    why: {
      en: 'Google Safe Browsing lists {domain} as {threat}. Do not open it.',
      pcm: 'Google Safe Browsing don list {domain} as {threat}. No open am.',
    },
  },
  'urlhaus-listed': {
    title: { en: 'Link is on a malware blocklist', pcm: 'The link dey malware blocklist' },
    why: {
      en: 'URLhaus, a security research database, lists this link as spreading malware. Do not open it.',
      pcm: 'URLhaus, one security database, don list this link say e dey spread virus. No open am.',
    },
  },
};

// Things CheckAm actually checked. tone: good | neutral
export const FACTS = {
  'official-link': {
    en: 'The link goes to {domain}, the official website of {org}. That is a good sign for the link, but it doesn\'t prove who sent the message.',
    pcm: 'The link dey go {domain}, wey be {org} real website. Na good sign for the link, but e no prove who send the message.',
  },
  'govng-link': {
    en: 'The link goes to {domain}. Websites ending in .gov.ng are reserved for Nigerian government bodies. Good sign, but not a guarantee.',
    pcm: 'The link dey go {domain}. Website wey end with .gov.ng na only government fit get am. Good sign, but e no be guarantee.',
  },
  'known-platform': {
    en: 'The link goes to {domain} ({org}). Anyone can post content there, so check who posted it.',
    pcm: 'The link dey go {domain} ({org}). Anybody fit post for there, so check who post am.',
  },
  'domain-age': {
    en: '{domain} was first registered in {year}. Older websites aren\'t automatically safe, but scam sites are usually new.',
    pcm: 'Dem first register {domain} for {year}. Old website no mean say e safe, but scam site dey usually new.',
  },
  'domain-not-registered': {
    en: '{domain} is not currently registered. The site may have been taken down, or the link is mistyped. Either way, don\'t trust it.',
    pcm: 'Nobody get {domain} for now. Maybe dem don pull the site down, or the link no correct. Either way, no trust am.',
  },
  'safe-browsing-clean': {
    en: 'Google Safe Browsing has no warning for this link. New scam sites often aren\'t listed yet.',
    pcm: 'Google Safe Browsing no get warning for this link. New scam site fit never enter their list.',
  },
  'urlhaus-clean': {
    en: 'Not on the URLhaus malware blocklist.',
    pcm: 'E no dey URLhaus malware blocklist.',
  },
  'short-link-destination': {
    en: 'The short link {from} actually opens {to}.',
    pcm: 'The short link {from} dey actually open {to}.',
  },
  'no-links': {
    en: 'No links found in the message.',
    pcm: 'We no see any link for the message.',
  },
};

export const UNKNOWNS = {
  'sender-identity': {
    en: 'Who really sent this. Names, profile photos and even caller IDs can be faked.',
    pcm: 'Who really send am. Dem fit fake name, profile picture, even the number wey show.',
  },
  'phone-owner': {
    en: 'Who owns the phone number(s) in the message.',
    pcm: 'Who get the phone number wey dey the message.',
  },
  'account-owner': {
    en: 'Who owns the account number. Check the name your bank shows before paying, but a matching name still isn\'t proof.',
    pcm: 'Who get the account number. Check the name wey your bank show before you pay, but even if name match, e no be proof.',
  },
  'official-announcement': {
    en: 'Whether {org} actually announced this. CheckAm can\'t search their announcements, so check their official website or verified social media yourself.',
    pcm: 'Whether {org} really announce this thing. CheckAm no fit search their announcement, so check their real website or verified social media by yourself.',
  },
  'official-announcement-generic': {
    en: 'Whether the organisation named actually announced this. Check their official website or verified social media yourself.',
    pcm: 'Whether the organisation wey dem mention really announce am. Check their real website or verified social media by yourself.',
  },
  'email-owner': {
    en: 'Whether the email address really belongs to who it claims.',
    pcm: 'Whether the email address really belong to who dem claim.',
  },
  'links-pending': {
    en: 'Online link checks are still running…',
    pcm: 'We still dey check the link online…',
  },
  'links-offline': {
    en: 'Whether the link is on known scam lists. Online checks couldn\'t run right now.',
    pcm: 'Whether the link dey known scam list. Online check no fit run now.',
  },
  'short-link-unknown': {
    en: 'Where the short link {domain} really leads.',
    pcm: 'Where the short link {domain} really dey go.',
  },
  'domain-age-unknown': {
    en: 'When {domain} was registered. Its registry didn\'t tell us.',
    pcm: 'When dem register {domain}. Dem no gree show us.',
  },
  'ocr-errors': {
    en: 'Whether the text was read correctly from the screenshot. Check the text box for mistakes.',
    pcm: 'Whether we read the screenshot correct. Check the text box make sure say e correct.',
  },
};

export const ADVICE = {
  pause: {
    en: 'Pause. Scammers depend on panic, and a genuine request can wait while you check.',
    pcm: 'Calm down small. Scammers dey use fear. Real request fit wait make you confirm.',
  },
  'independent-channel': {
    en: 'Contact the person or organisation using a number or website you find yourself, not one in the message.',
    pcm: 'Contact the person or company with number or website wey you find by yourself, no be the one for the message.',
  },
  'never-share-codes': {
    en: 'Never share an OTP, PIN, password or card details with anyone, even "bank staff".',
    pcm: 'No ever give anybody your OTP, PIN, password or card details, even if dem say na "bank staff".',
  },
  'org-official-site': {
    en: 'Type {official} into your browser yourself, or use the official {org} app. Don\'t use the link in the message.',
    pcm: 'Type {official} for your browser by yourself, or use the real {org} app. No use the link for the message.',
  },
  'job-no-fee': {
    en: 'Real employers never charge you to get a job, training or an interview.',
    pcm: 'Real employer no dey collect money before dem give you job, training or interview.',
  },
  'job-official-careers': {
    en: 'Look for the job on the company\'s official careers page or verified LinkedIn page.',
    pcm: 'Find the job for the company real careers page or their verified LinkedIn page.',
  },
  'job-search-name': {
    en: 'Search the company name with the word "scam" and see what others report.',
    pcm: 'Search the company name plus "scam" for Google, see wetin other people talk.',
  },
  'bank-use-app': {
    en: 'Open your bank app, or call the number on the back of your card. If your account really has a problem, you\'ll see it there.',
    pcm: 'Open your bank app, or call the number wey dey back of your card. If your account get problem true true, you go see am there.',
  },
  'bank-branch': {
    en: 'If you\'re unsure, walk into a branch. Banks never fix "blocked accounts" through links.',
    pcm: 'If you no sure, go the bank branch. Bank no dey use link fix "blocked account".',
  },
  'govt-check-govng': {
    en: 'Look for the programme on the agency\'s .gov.ng website or its verified social media accounts.',
    pcm: 'Find the programme for the agency .gov.ng website or their verified social media.',
  },
  'govt-no-fee': {
    en: 'Government grants, scholarships and palliatives are never "released" after you pay a fee.',
    pcm: 'Government grant, scholarship or palliative no dey need make you pay fee before dem "release" am.',
  },
  'prize-didnt-enter': {
    en: 'If you didn\'t enter a draw, you didn\'t win it.',
    pcm: 'If you no enter any promo, you no win anything.',
  },
  'prize-no-fee': {
    en: 'Real prizes don\'t require a "delivery" or "tax" payment first.',
    pcm: 'Real prize no dey need make you pay "delivery" or "tax" first.',
  },
  'family-call-old-number': {
    en: 'Call the person on the number you already have, or ask a question only they would know.',
    pcm: 'Call the person for the old number wey you get, or ask question wey only dem go know.',
  },
  'family-ask-others': {
    en: 'Check with another family member or friend before sending anything.',
    pcm: 'Ask another family member or friend before you send anything.',
  },
  'invest-sec': {
    en: 'Check whether the company is registered with SEC Nigeria at sec.gov.ng.',
    pcm: 'Check if SEC Nigeria register the company for sec.gov.ng.',
  },
  'invest-too-good': {
    en: 'If returns are high and "guaranteed", assume it\'s a Ponzi scheme until proven otherwise.',
    pcm: 'If profit big and dem say e "sure", take am say na Ponzi until you confirm.',
  },
  'delivery-track': {
    en: 'Track the parcel on the courier\'s official website by typing the address yourself.',
    pcm: 'Track the parcel for the courier real website. Type the address by yourself.',
  },
  'delivery-expecting': {
    en: 'Ask yourself: am I actually expecting a parcel from this company?',
    pcm: 'Ask yourself: I dey really expect parcel from this company?',
  },
  'reversal-check-balance': {
    en: 'Check your balance in your bank app. SMS alerts and screenshots can be faked.',
    pcm: 'Check your balance for your bank app. Dem fit fake SMS alert and screenshot.',
  },
  'reversal-bank': {
    en: 'If money really arrived by mistake, tell the sender to contact their bank. Banks handle reversals.',
    pcm: 'If money really enter by mistake, tell the person make e contact im bank. Na bank dey handle reversal.',
  },
  'shop-pay-on-delivery': {
    en: 'Prefer pay-on-delivery or a trusted marketplace over paying a stranger upfront.',
    pcm: 'Better make you pay when the thing reach your hand, or use trusted market app, no pay stranger first.',
  },
  'shop-reviews': {
    en: 'Look for reviews from real customers outside the seller\'s own page.',
    pcm: 'Find review from real customers wey no dey the seller own page.',
  },
  'loan-fccpc': {
    en: 'Only borrow from lenders on the FCCPC approved list (fccpc.gov.ng). Real lenders deduct fees from the loan, not before it.',
    pcm: 'Only borrow from lenders wey dey FCCPC approved list (fccpc.gov.ng). Real lender go remove fee from the loan, no be before.',
  },
};

export function fmt(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ''));
}
