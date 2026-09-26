// Vercel route for /api/ai-check. Uses the Workers AI REST API; set
// CF_ACCOUNT_ID and CF_AI_TOKEN in Vercel. Logic lives in server/ai-check.js.
import { aiCheck } from '../server/ai-check.js';

export const POST = (request) => aiCheck(request, process.env);
export const GET = POST; // answers 405
