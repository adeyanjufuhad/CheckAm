// POST /api/log  — anonymous usage + feedback, to learn whether people
// understand CheckAm and come back to it.
//
// Stores only: result level, category, language, input type, which rule ids
// fired, and yes/no feedback answers. Never message text, links, numbers, IP
// addresses or any identifier. If no D1 database is bound, it's a no-op.

const LEVELS = new Set(['danger', 'caution', 'unclear']);
const LANGS = new Set(['en', 'pcm']);
const SOURCES = new Set(['text', 'image', 'share']);
const TYPES = new Set(['check', 'feedback']);
const YES_NO = new Set(['yes', 'no']);
const ID_RE = /^[a-z0-9-]{1,40}$/;

const pick = (set, v) => (set.has(v) ? v : null);

export async function onRequestPost({ request, env }) {
  if (!env.DB) return new Response(null, { status: 204 });

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const type = pick(TYPES, body?.type);
  if (!type) return new Response(null, { status: 400 });

  const rules = Array.isArray(body.rules) ? body.rules.filter((r) => ID_RE.test(r)).slice(0, 20).join(',') : null;
  const category = typeof body.category === 'string' && ID_RE.test(body.category) ? body.category : null;

  await env.DB.prepare(
    'INSERT INTO events (type, level, category, lang, source, rules, helpful, first_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).bind(
    type,
    pick(LEVELS, body.level),
    category,
    pick(LANGS, body.lang),
    pick(SOURCES, body.source),
    rules,
    pick(YES_NO, body.helpful),
    pick(YES_NO, body.firstTime),
  ).run();

  return new Response(null, { status: 204 });
}

export function onRequest() {
  return new Response(null, { status: 405, headers: { Allow: 'POST' } });
}
