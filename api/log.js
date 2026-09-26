// Vercel route for /api/log. Anonymous stats are stored in Cloudflare D1, which
// Vercel doesn't have, so this accepts and discards them (the page never waits on it).
export const POST = () => new Response(null, { status: 204 });
