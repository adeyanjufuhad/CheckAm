// Vercel route for /api/check-link. Logic lives in server/check-link.js.
import { checkLinks } from '../server/check-link.js';

export const POST = (request) => checkLinks(request, process.env);
export const GET = POST; // answers 405
