// Cloudflare Pages route for /api/check-link. Logic lives in server/check-link.js.
import { checkLinks } from '../../server/check-link.js';

export const onRequest = ({ request, env }) => checkLinks(request, env);
