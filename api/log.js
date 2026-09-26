// Vercel route for /api/log. Anonymous stats live in Cloudflare D1, which
// Vercel doesn't have, so forward them to the Cloudflare site's /api/log
// (same anonymous fields; the IP address is not passed on). Set
// LOG_FORWARD_URL to change the target, or to "" to discard instead.
const DEFAULT_TARGET = 'https://checkam.pages.dev/api/log';

export async function POST(request) {
  const target = process.env.LOG_FORWARD_URL ?? DEFAULT_TARGET;
  if (!target) return new Response(null, { status: 204 });
  try {
    const body = await request.text();
    if (body.length > 4000) return new Response(null, { status: 413 });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch {
    // Stats are best-effort; never fail the page over them.
  }
  return new Response(null, { status: 204 });
}
