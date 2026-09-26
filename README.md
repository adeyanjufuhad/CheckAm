# CheckAm

**Check am before you click, pay or share.** A free scam checker for Nigerian messages, links and screenshots, in English and Nigerian Pidgin.

Paste a message, add a screenshot or share straight from WhatsApp. CheckAm shows:

1. **What looks suspicious**, and why, quoting the exact words it found
2. **What it checked**: official domains, website age, Google Safe Browsing, malware lists
3. **What it can't know**: who sent it, who owns the account number, and so on
4. **How to check it yourself**, with steps that fit the scam type

It never says a message is "safe". The best result is *"No clear warning signs, but that doesn't mean it's safe."*

## How it works

| Piece | Where it runs | Cost |
|---|---|---|
| Scam rules (`public/js/engine/`) | In the user's browser. **The message never leaves the phone.** | Free |
| Screenshot reading (Tesseract.js) | In the browser. The image is never uploaded. ~3 MB download the first time. | Free |
| Link checks (`server/check-link.js`) | Cloudflare Pages Function or Vercel Function. **Only the link is sent.** | Free tiers |
| Anonymous stats and feedback (`functions/api/log.js`) | Cloudflare D1, optional (Cloudflare only) | Free tier |
| Hosting | Cloudflare Pages and/or Vercel | Free |

It's also an installable app (PWA). On Android, installed users can **share a message from WhatsApp directly into CheckAm**. It works offline too, though link checks need a connection.

## Run it locally

```bash
npm install
npm test          # 37 tests: real scam patterns + ordinary messages that must NOT be flagged
npm run dev       # http://localhost:8788
```

## Deploy for free (Cloudflare Pages)

1. Create a free account at https://dash.cloudflare.com/sign-up
2. `npx wrangler login` (opens your browser)
3. `npm run deploy`. Your site goes live at `https://checkam.pages.dev`.

The deploy script uses `--branch CheckAm` because that is the project's production branch in Cloudflare. Without it, deploys from `master` go to a *preview* URL and `checkam.pages.dev` stays empty.

## Deploy for free (Vercel)

Easiest: on https://vercel.com/new, import the GitHub repo. Leave the framework as "Other"; `vercel.json` already sets the output folder. Every push to GitHub then deploys automatically.

Or from the terminal: `npx vercel login`, then `npm run deploy:vercel`.

On Vercel, add `GSB_API_KEY` / `URLHAUS_AUTH_KEY` under Project → Settings → Environment Variables. Anonymous stats (`/api/log`) are accepted but not stored on Vercel, because they use Cloudflare D1.

Folder layout: `public/` is the site. `server/` holds the shared link-check logic. `functions/` holds the Cloudflare routes and `api/` the Vercel routes; both are thin wrappers.

### Optional: stronger link checks (both free)

Set these in Cloudflare dashboard → Workers & Pages → checkam → Settings → Variables and secrets (or in Vercel's Environment Variables). For local testing, copy `.dev.vars.example` to `.dev.vars`.

- `GSB_API_KEY`: Google Safe Browsing API key from Google Cloud Console. **Free for non-commercial use only.** If you start charging businesses, switch to Google Web Risk, which is paid.
- `URLHAUS_AUTH_KEY`: free key from https://auth.abuse.ch/

Without these keys, CheckAm still checks domain age, lookalike and misspelled domains, short-link destinations and everything in the message text.

### Optional: anonymous feedback (to test whether people understand it)

```bash
npx wrangler d1 create checkam     # paste the printed database_id into wrangler.toml, uncomment the block
npm run db:init
npm run deploy
npm run db:stats                   # see results
```

Only these fields are stored: result level, scam category, language, input type, which rules fired, and yes/no answers to "Did this make sense?" and "First time using CheckAm?". Never message text, links, numbers or IP addresses.

## Improving it

- **Official websites:** `public/js/engine/sources.js`. This is CheckAm's most valuable data. Verify every domain on two independent sources before adding it, because a wrong entry makes CheckAm vouch for a scam site.
- **Wording (English and Pidgin):** `public/js/engine/copy.js` and `public/js/ui-strings.js`. **Have native Pidgin speakers review these.**
- **Scam patterns:** `public/js/engine/rules.js`. Add a test in `tests/engine.test.js` for each new pattern, including an ordinary message it must *not* flag.
- After changing files that the offline cache keeps, bump `CACHE` in `public/sw.js`.

## Before a wider launch

- Test with 20–50 real people: do they understand the explanations, and do they come back?
- A real domain (`.ng` / `.com.ng`) looks more trustworthy than `pages.dev`, which matters for an anti-scam tool. It's a small yearly cost.
- Add a privacy notice that meets the Nigeria Data Protection Act (NDPA) 2023.
