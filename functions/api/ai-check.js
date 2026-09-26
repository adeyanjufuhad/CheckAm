// Cloudflare Pages route for /api/ai-check. Logic lives in server/ai-check.js.
import { aiCheck } from '../../server/ai-check.js';

export const onRequest = ({ request, env }) => aiCheck(request, env);
