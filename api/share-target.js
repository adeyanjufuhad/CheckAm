// Vercel fallback for shares that arrive before the service worker is running.
// See functions/share-target.js: drop the content, send the person home.
const redirectHome = (request) => Response.redirect(new URL('/?shared=failed', request.url).href, 303);

export const POST = redirectHome;
export const GET = redirectHome;
