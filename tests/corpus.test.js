// A broad collection of real-world Nigerian scam messages (names and numbers
// made up). Every scam must reach at least "Some warning signs": a scam shown
// as "No clear warning signs" is the failure testers notice and remember.
// Add every scam a tester reports here, plus an ordinary look-alike below.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../public/js/engine/analyze.js';

export const SCAM_CORPUS = [
  // Too-cheap offers: land, property, cars, gadgets
  ['land 10k', 'buy plot of land in ogun state for 10k naira'],
  ['land promo', 'Promo promo! Dry land in Ibeju-Lekki, 600sqm plot now 150k only. Pay 50k deposit to secure your plot before price increase. Call 08031234567'],
  ['land pidgin', 'Land dey sale for Mowe, one plot na 30k, carry your money come quick before e finish'],
  ['house cheap', '3 bedroom duplex for sale in Lekki, 2.5 million naira, owner travelling abroad, pay deposit to hold'],
  ['car customs auction', 'Nigeria Customs auction: Toyota Camry 2018 going for 450k. Pay clearing fee and it will be delivered to you'],
  ['car cheap', 'Tokunbo Lexus RX350 2016 for sale 900k only, pay before delivery, serious buyers only'],
  ['iphone cheap', 'iPhone 15 Pro Max brand new sealed 180k. DM to order, payment before delivery'],
  ['ps5 cheap', 'PS5 slim available 95k only, limited stock, send your address and pay to confirm order'],
  ['macbook', 'buy a macbook brand new m1 pro for 600k'],

  // Rent and agents
  ['rent agent', 'Self contain available in Yaba, pay 30k inspection fee to my account before we go and see the room'],
  ['hostel agent', 'Hostel space available near UNILAG, pay 20k to secure your bed space now, first come first serve'],

  // Jobs
  ['job fee', 'Congratulations! You have been shortlisted for the Data Entry position at Shell. Pay a registration fee of N5,000 to secure your slot.'],
  ['task job', 'Earn 20k daily from home! Just like and subscribe YouTube videos. Join our Telegram group to start.'],
  ['abroad job', 'Canada work visa jobs available, no IELTS needed. Pay 150k for processing and you travel in 2 weeks'],
  ['nysc', 'NYSC: all corps members should pay 3,500 for the new NYSC ID card upgrade before Friday or be decamped'],

  // Banks, fintechs, telcos
  ['bank block', 'Dear customer, your GTBank account will be blocked within 24hrs. Click the link to verify your BVN: http://gtbank-verify.xyz/login'],
  ['bvn link', 'Your BVN has been flagged. To avoid suspension of all your bank accounts, update your BVN at bvnupdate-ng.com'],
  ['atm expired', 'Your ATM card has expired. Call our customer care on 09012345678 to renew it and provide your card details'],
  ['otp code', 'Sorry I mistakenly sent my verification code to your number, please forward it to me'],
  ['sim swap', 'MTN: Your SIM will be barred today due to NIN verification. Reply with your NIN and date of birth to avoid disconnection'],
  ['app update', 'Opay: Please update your Opay app with this new link to continue using your account https://opay-update.app'],

  // Money requests and fake payments
  ['new number', 'Hi mummy, this is my new number. Abeg send me 20k urgently, I go explain later'],
  ['emergency', 'Please help, I was involved in an accident and I am at the hospital. Send 50k to this account 0123456789 now'],
  ['wrong transfer', 'Hello, I mistakenly transferred 50,000 naira to your account. Please kindly reverse it.'],
  ['fake alert', 'Credit alert: NGN150,000.00 has been credited to your account. Kindly release the goods to our driver.'],
  ['wrong recharge', 'I mistakenly recharged 5000 airtime to your line please send it back to me'],

  // Grants, promos, prizes
  ['fg grant', 'FG Youth Empowerment Grant 2026: The federal government is giving N250,000 to youths. Apply now: https://fg-youth-grant.blogspot.com'],
  ['cbn loan', 'CBN is giving interest free loans of 500k to all Nigerians. Register with your BVN on WhatsApp 08012345678'],
  ['mtn promo', 'Congratulations! Your line has won N1,000,000 in the MTN anniversary promo. Call 09098765432 to claim your prize'],
  ['free data', 'MTN is giving everyone free 50GB data to celebrate. Click here to claim now: bit.ly/freedata50'],
  ['scholarship', 'Fully funded scholarship to study in the UK. Pay 25k application processing fee to our agent to be considered'],
  ['jamb upgrade', 'We can upgrade your JAMB score to 300. Pay 15k and send your registration number'],
  ['waec result', 'WAEC result upgrade available. Pay 20k and your result will be changed within 3 days'],

  // Investment
  ['ponzi', 'Invest 50k and get 150k in 7 days guaranteed. No risk. Refer your friends and earn more'],
  ['crypto manager', 'I am a certified forex trader. Send me 100k and I will trade it for you, you will get 40% profit weekly'],
  ['crypto recovery', 'Lost money to a crypto scam? Our recovery agents can get your funds back. Pay a small fee to start'],
  ['investment app', 'New investment app paying 5% daily! Download now and start earning, withdrawal every 24 hours'],

  // Delivery, travel, loans, 419
  ['customs parcel', 'Your parcel from UK is held at customs. Pay N12,500 clearance fee to release it'],
  ['fake visa agent', 'UK visa guaranteed in 5 days, no interview. Pay 300k to our agent account'],
  ['loan app', 'Instant loan approved! Get 200k in 5 minutes, no collateral. Pay 5k insurance fee first'],
  ['inheritance', 'I am Barrister Ade. Your late relative left $4.5 million and you are the next of kin'],
  ['romance', 'My love, I am stuck at the airport and customs want 300k before they release my luggage. Please send it, I will pay back when I arrive'],
  ['charity', 'Please donate to save baby Tolu who needs 10 million naira for heart surgery in India. Send to 0123456789 GTBank'],
  ['ticket', 'Burna Boy concert tickets available at 5k, very limited! Pay now to reserve, tickets will be sent to your email'],
];

// Ordinary messages that must never be called "Strong signs of a scam".
export const ORDINARY_CORPUS = [
  ['otp sms', 'Your OTP is 482913. It expires in 5 minutes. Do not share it with anyone.'],
  ['debit alert', 'Acct: 01****789 Amt: NGN5,000.00 DR Desc: POS PURCHASE Bal: NGN20,145.50'],
  ['friend lunch', 'Hey, are we still meeting at 5pm? I will bring the notes for the exam.'],
  ['bought phone', 'I finally bought a new iPhone yesterday, it cost me 900k but I love it'],
  ['wedding', 'Congratulations on your wedding! Wishing you both happiness.'],
  ['school fee', 'Reminder: the post-UTME application fee is ₦2,000. Pay on the university portal.'],
  ['church', 'Service starts at 9am tomorrow. Remember to bring your bible.'],
  ['family transfer', 'I have sent the 20k for your transport, let me know when you get it'],
  ['realistic land', 'We visited the land in Mowe today. The surveyor said the documents look fine and the price is 4 million per plot.'],
];

for (const [name, text] of SCAM_CORPUS) {
  test(`corpus scam flagged: ${name}`, () => {
    const r = analyze(text);
    assert.notEqual(r.level, 'unclear', `"${name}" got "unclear". Findings: ${r.findings.map((f) => f.id).join(', ') || 'none'}`);
  });
}

for (const [name, text] of ORDINARY_CORPUS) {
  test(`corpus ordinary not called a scam: ${name}`, () => {
    const r = analyze(text);
    assert.notEqual(r.level, 'danger', `"${name}" got "danger": ${r.findings.map((f) => f.id).join(', ')}`);
  });
}
