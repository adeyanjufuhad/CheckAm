import { analyze } from './engine/analyze.js';
import { extractUrls } from './engine/links.js';
import { LEVELS, FINDINGS, FACTS, UNKNOWNS, ADVICE, fmt as fmtIn } from './engine/copy.js';
import { UI, EXAMPLES } from './ui-strings.js';
import { whatsappLink, emailLink } from './config.js';

const $ = (sel) => document.querySelector(sel);
const form = $('#check-form');
const input = $('#message');
const fileInput = $('#screenshot');
const statusEl = $('#status');
const resultEl = $('#result');

const state = {
  lang: 'en',
  text: '',
  source: 'text',
  report: null,
  online: undefined,
  ai: null,
  image: null, // the screenshot File, kept only in memory for the optional AI read
  imageData: null, // its shrunk JPEG data URL, made on first AI request
  runId: 0,
  deferredInstall: null,
};

// ---------- Small helpers ----------

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

function svgIcon(name) {
  const paths = {
    danger: '<path d="M8.6 2h6.8L22 8.6v6.8L15.4 22H8.6L2 15.4V8.6z"/><path d="M12 7v6M12 16.5v.5"/>',
    caution: '<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.5"/>',
    unclear: '<circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.5"/>',
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    dot: '<circle cx="12" cy="12" r="3"/>',
    question: '<circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.5"/>',
    alert: '<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.5"/>',
  };
  const span = document.createElement('span');
  span.className = 'icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
  return span;
}

// Variables like an item name come as { en, pcm }; fill them in the current language.
const fmt = (str, vars) => fmtIn(str, vars, state.lang);
const t = (key, vars) => fmt(UI[state.lang][key] ?? UI.en[key] ?? key, vars);
const pick = (obj) => (obj ? obj[state.lang] ?? obj.en : '');

function storage(action, key, value) {
  try {
    if (action === 'get') return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: remembering the language is just a nicety.
  }
  return null;
}

function setStatus(message, kind = 'info') {
  statusEl.textContent = message || '';
  statusEl.dataset.kind = kind;
  statusEl.hidden = !message;
}

function log(payload) {
  try {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: state.lang, ...payload }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Logging must never break the check.
  }
}

// ---------- Language ----------

function applyLanguage() {
  document.documentElement.lang = state.lang === 'pcm' ? 'pcm' : 'en';
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) node.placeholder = t(node.dataset.i18nPlaceholder);
  for (const btn of document.querySelectorAll('[data-lang]')) btn.setAttribute('aria-pressed', String(btn.dataset.lang === state.lang));
  updateContactLinks();
  if (state.report) render();
}

function setLanguage(lang) {
  state.lang = lang === 'pcm' ? 'pcm' : 'en';
  storage('set', 'checkam-lang', state.lang);
  applyLanguage();
}

// ---------- Checking ----------

async function runCheck(text, source) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    setStatus(t('empty'), 'error');
    input.focus();
    return;
  }
  resetFeedback(); // send any answers about the previous result first
  const runId = ++state.runId;
  state.text = trimmed;
  state.source = source;
  state.ai = null;
  if (source !== 'image') {
    state.image = null;
    state.imageData = null;
  }
  state.online = extractUrls(trimmed).length ? { status: 'pending' } : undefined;
  state.report = analyze(trimmed, { source, online: state.online });
  if (source !== 'image') setStatus('');
  render({ scroll: true });

  log({ type: 'check', level: state.report.level, category: state.report.category, source, rules: state.report.meta.ruleIds });
  checkLinksOnline(runId);
}

async function checkLinksOnline(runId) {
  const urls = extractUrls(state.text);
  if (!urls.length) return;
  let online;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch('/api/check-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: urls.slice(0, 5) }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    online = { status: 'done', results: data.results || [] };
  } catch {
    online = { status: 'failed' };
  }
  if (runId !== state.runId) return; // user started another check meanwhile
  state.online = online;
  state.report = analyze(state.text, { source: state.source, online });
  render();
}

// ---------- Rendering ----------

function render({ scroll = false } = {}) {
  const r = state.report;
  resultEl.replaceChildren();
  if (!r && state.image) {
    // The phone couldn't read the screenshot: offer the AI, which can see it.
    resultEl.hidden = false;
    resultEl.className = 'result level-unclear';
    resultEl.append(renderAI());
    if (scroll) resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (!r) {
    resultEl.hidden = true;
    return;
  }
  resultEl.hidden = false;
  const level = displayLevel();
  resultEl.className = `result level-${level}`;

  resultEl.append(
    el('div', { class: 'verdict', role: 'status' },
      svgIcon(level),
      el('div', {},
        el('h2', { class: 'verdict-title', tabindex: '-1', id: 'verdict-title' }, pick(LEVELS[level].headline)),
        el('p', { class: 'verdict-sub' }, pick(LEVELS[level].sub)),
        level !== r.level ? el('p', { class: 'verdict-raised' }, t('aiRaised')) : null,
      ),
    ),
  );

  // What looks suspicious
  const main = r.findings.filter((f) => f.severity !== 'low');
  const minor = r.findings.filter((f) => f.severity === 'low');
  const findingItem = (f) => el('li', { class: `finding sev-${f.severity}` },
    el('strong', { class: 'finding-title' }, fmt(pick(FINDINGS[f.id].title), f.vars)),
    el('p', {}, fmt(pick(FINDINGS[f.id].why), f.vars)),
    f.evidence ? el('p', { class: 'evidence' }, el('span', {}, t('found')), ' ', el('q', {}, f.evidence)) : null,
  );
  const suspicious = el('section', { class: 'block' }, el('h3', {}, svgIcon('alert'), t('suspicious')));
  if (!r.findings.length) {
    suspicious.append(el('p', { class: 'muted' }, t('nothingFound')));
  } else {
    if (main.length) suspicious.append(el('ul', { class: 'findings' }, main.map(findingItem)));
    if (minor.length) {
      const list = el('ul', { class: 'findings' }, minor.map(findingItem));
      suspicious.append(main.length
        ? el('details', { class: 'minor' }, el('summary', {}, t('smallerSigns', { n: minor.length })), list)
        : list);
    }
  }
  // When CheckAm isn't sure, the AI check is the most useful next step, so it
  // goes first; otherwise it follows the rule-based findings.
  const aiBlock = renderAI();
  const unsure = r.level === 'unclear';
  if (aiBlock && unsure) resultEl.append(aiBlock);
  resultEl.append(suspicious);
  if (aiBlock && !unsure) resultEl.append(aiBlock);

  // What CheckAm checked
  const checkedItems = r.facts.map((f) => el('li', { class: `fact tone-${f.tone}` }, svgIcon(f.tone === 'good' ? 'check' : 'dot'), el('span', {}, fmt(pick(FACTS[f.id]), f.vars))));
  const pending = state.online?.status === 'pending';
  resultEl.append(el('section', { class: 'block' },
    el('h3', {}, svgIcon('check'), t('checked')),
    pending ? el('p', { class: 'pending' }, el('span', { class: 'spinner', 'aria-hidden': 'true' }), t('linksChecking')) : null,
    checkedItems.length ? el('ul', { class: 'facts' }, checkedItems) : null,
  ));

  // What CheckAm can't know
  const unknowns = r.unknowns.filter((u) => u.id !== 'links-pending');
  resultEl.append(el('section', { class: 'block' },
    el('h3', {}, svgIcon('question'), t('unknown')),
    el('ul', { class: 'unknowns' }, unknowns.map((u) => el('li', {}, fmt(pick(UNKNOWNS[u.id]), u.vars)))),
  ));

  // How to check
  resultEl.append(el('section', { class: 'block howto' },
    el('h3', {}, t('howTo')),
    el('ol', {}, r.advice.map((a) => el('li', {}, fmt(pick(ADVICE[a.id]), a.vars)))),
  ));

  // Actions
  const copyBtn = el('button', { type: 'button', class: 'btn btn-secondary', onclick: () => copyResult(copyBtn) }, t('copy'));
  resultEl.append(el('div', { class: 'actions' },
    el('button', { type: 'button', class: 'btn btn-share', onclick: shareResult }, t('shareFamily')),
    copyBtn,
    el('button', { type: 'button', class: 'btn btn-ghost', onclick: resetForm }, t('again')),
  ));

  resultEl.append(renderFeedback());

  if (scroll) {
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#verdict-title')?.focus({ preventScroll: true });
  }
}

// ---------- Optional AI check ----------
// Only on request: it's the one feature that sends the message text anywhere.
// The AI can raise the level shown, never lower it.

const LEVEL_RANK = { unclear: 0, caution: 1, danger: 2 };

function displayLevel() {
  const base = state.report.level;
  const ai = state.ai?.status === 'done' ? state.ai.result.verdict : 'unclear';
  return LEVEL_RANK[ai] > LEVEL_RANK[base] ? ai : base;
}

// Words in common between two readings of the same screenshot (0..1).
function similarity(a, b) {
  const words = (s) => new Set(String(s).toLowerCase().match(/[a-z0-9₦]{2,}/g) || []);
  const A = words(a);
  const B = words(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / (A.size + B.size - shared);
}

// If the AI read the screenshot clearly better than the phone did, show its
// reading and re-run CheckAm's own checks on it (the AI result stays).
function useAITranscript(transcript, runId) {
  const phoneText = state.text || '';
  const muchBetter = !phoneText || similarity(phoneText, transcript) < 0.6 || phoneText.length < transcript.length * 0.6;
  if (!muchBetter) return false;
  input.value = transcript;
  state.text = transcript;
  state.online = extractUrls(transcript).length ? { status: 'pending' } : undefined;
  state.report = analyze(transcript, { source: 'image', online: state.online });
  checkLinksOnline(runId);
  return true;
}

async function askAI() {
  const runId = state.runId;
  state.ai = { status: 'loading' };
  render();
  try {
    let image;
    if (state.image) {
      if (!state.imageData) {
        const { imageToDataUrl } = await import('./ocr.js');
        state.imageData = await imageToDataUrl(state.image);
      }
      image = state.imageData;
    }
    const controller = new AbortController();
    // The server may try several AI models in turn, so allow a little longer.
    const timer = setTimeout(() => controller.abort(), 55000);
    const res = await fetch('/api/ai-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: state.text, lang: state.lang, image }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status === 429) {
      if (runId !== state.runId) return;
      state.ai = { status: 'failed', reason: 'limit' };
      render();
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    if (runId !== state.runId) return;
    const reread = Boolean(state.image && result.transcript && useAITranscript(result.transcript, runId));
    state.ai = { status: 'done', result, reread };
    // An unreadable screenshot the AI couldn't read either: nothing to check.
    if (!state.report) {
      state.ai = { status: 'failed' };
    } else {
      log({ type: 'ai', level: result.verdict, category: state.report.category, source: state.source, rules: state.report.meta.ruleIds });
    }
  } catch {
    if (runId !== state.runId) return;
    state.ai = { status: 'failed' };
  }
  render();
}

function renderAI() {
  const ai = state.ai;
  const level = state.report?.level;
  // Nothing to add when the rules already found strong signs in a typed message.
  // For a screenshot the AI can still help: it reads the picture itself.
  if (!ai && level === 'danger' && !state.image) return null;
  const block = el('section', { class: 'block ai-block' });
  const img = Boolean(state.image);

  if (!ai) {
    block.append(
      el('h3', {}, el('span', { class: 'ai-badge' }, 'AI'), t(img ? 'aiAskTitleImage' : 'aiAskTitle')),
      !state.report && img ? el('p', {}, t('ocrNoTextAi')) : null,
      el('p', { class: 'muted' }, t(img ? 'aiAskNoteImage' : 'aiAskNote')),
      el('button', { type: 'button', class: `btn ${!level || level === 'unclear' ? 'btn-primary' : 'btn-secondary'} ai-ask`, onclick: askAI }, t(img ? 'aiAskBtnImage' : 'aiAskBtn')),
    );
  } else if (ai.status === 'loading') {
    block.append(el('p', { class: 'pending' }, el('span', { class: 'spinner', 'aria-hidden': 'true' }), t('aiLoading')));
  } else if (ai.status === 'failed' && ai.reason === 'limit') {
    block.append(el('p', { class: 'muted' }, t('aiLimit')));
  } else if (ai.status === 'failed') {
    block.append(
      el('p', { class: 'muted' }, t('aiFailed')),
      el('button', { type: 'button', class: 'btn btn-secondary ai-ask', onclick: askAI }, t('aiRetry')),
    );
  } else {
    const { signs, checks } = ai.result;
    block.append(el('h3', {}, el('span', { class: 'ai-badge' }, 'AI'), t('aiTitle')));
    if (ai.reread) block.append(el('p', { class: 'ai-reread' }, t('aiReread')));
    if (signs.length) {
      block.append(el('ul', { class: 'findings' }, signs.map((s) => el('li', { class: 'finding sev-medium' },
        el('strong', { class: 'finding-title' }, s.title),
        el('p', {}, s.why),
      ))));
    } else {
      block.append(el('p', { class: 'muted' }, t('aiNone')));
    }
    if (checks.length) {
      block.append(el('p', { class: 'ai-sub' }, t('aiChecks')), el('ul', { class: 'ai-checks' }, checks.map((c) => el('li', {}, c))));
    }
    block.append(el('p', { class: 'ai-disclaimer' }, t('aiDisclaimer')));
  }
  return block;
}

// Three quick questions per result. Answers are sent once, when all three are
// done, or earlier if the person moves on (new check, leaves the page), so a
// half-answered survey still counts.
const FEEDBACK_STEPS = ['helpful', 'correct', 'firstTime', 'done'];
let feedback = { step: 'helpful', answers: {}, sent: false };

function flushFeedback() {
  if (feedback.sent || !Object.keys(feedback.answers).length || !state.report) return;
  feedback.sent = true;
  const r = state.report;
  log({ type: 'feedback', level: displayLevel(), category: r.category, source: state.source, rules: r.meta.ruleIds, ...feedback.answers });
}

function resetFeedback() {
  flushFeedback();
  feedback = { step: 'helpful', answers: {}, sent: false };
}

function reportLinks(template) {
  return el('div', { class: 'report-links' },
    el('a', { class: 'btn btn-chip', href: whatsappLink(template), target: '_blank', rel: 'noopener' }, t('reportWhatsApp')),
    el('a', { class: 'btn btn-chip', href: emailLink(t('reportSubject'), template) }, t('reportEmail')),
  );
}

function renderFeedback() {
  const box = el('div', { class: 'feedback' });
  const answer = (key, value) => {
    feedback.answers[key] = value;
    feedback.step = FEEDBACK_STEPS[FEEDBACK_STEPS.indexOf(key) + 1];
    if (feedback.step === 'done') flushFeedback();
    box.replaceWith(renderFeedback());
  };
  const chip = (key, value, label) => el('button', { type: 'button', class: 'btn btn-chip', onclick: () => answer(key, value) }, t(label));

  if (feedback.step === 'helpful') {
    box.append(el('p', {}, t('fbQuestion')), el('div', { class: 'fb-buttons' },
      chip('helpful', 'yes', 'fbYes'), chip('helpful', 'no', 'fbNo')));
  } else if (feedback.step === 'correct') {
    box.append(el('p', {}, t('fbCorrect')), el('div', { class: 'fb-buttons' },
      chip('correct', 'right', 'fbRight'), chip('correct', 'was-scam', 'fbWasScam'),
      chip('correct', 'was-genuine', 'fbWasGenuine'), chip('correct', 'unsure', 'fbUnsure')));
  } else if (feedback.step === 'firstTime') {
    box.append(el('p', {}, t('fbFirst')), el('div', { class: 'fb-buttons' },
      chip('firstTime', 'yes', 'yes'), chip('firstTime', 'no', 'no')));
  } else {
    box.append(el('p', { class: 'muted' }, t('fbThanks')));
  }

  // CheckAm got it wrong: ask for the message so the rules can be fixed.
  const wrong = feedback.answers.correct === 'was-scam' || feedback.answers.correct === 'was-genuine';
  if (wrong) {
    const template = t('reportWrongTemplate', {
      level: pick(LEVELS[state.report.level].headline),
      actual: t(feedback.answers.correct === 'was-scam' ? 'actualScam' : 'actualGenuine'),
    });
    box.append(el('div', { class: 'report-ask' }, el('p', {}, t('reportAsk')), reportLinks(template)));
  }
  return box;
}

// ---------- Sharing ----------

function shareText() {
  const r = state.report;
  const lines = [`${t('shareHeader')}: ${pick(LEVELS[displayLevel()].headline)}`];
  const top = r.findings.filter((f) => f.severity !== 'low').slice(0, 3).map((f) => fmt(pick(FINDINGS[f.id].title), f.vars));
  const aiSigns = state.ai?.status === 'done' ? state.ai.result.signs.map((s) => `${s.title} (AI)`) : [];
  const reasons = [...top, ...aiSigns].slice(0, 4);
  if (reasons.length) {
    lines.push('', t('shareWhy'));
    for (const reason of reasons) lines.push(`• ${reason}`);
  }
  lines.push('', t('shareDo'));
  for (const a of r.advice.slice(0, 3)) lines.push(`• ${fmt(pick(ADVICE[a.id]), a.vars)}`);
  lines.push('', `${t('shareFooter')} ${location.origin}`);
  return lines.join('\n');
}

async function shareResult() {
  const text = shareText();
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

async function copyResult(btn) {
  try {
    await navigator.clipboard.writeText(shareText());
    btn.textContent = t('copied');
    setTimeout(() => { btn.textContent = t('copy'); }, 2000);
  } catch {
    window.prompt('', shareText());
  }
}

function resetForm() {
  resetFeedback();
  state.report = null;
  state.ai = null;
  state.image = null;
  state.imageData = null;
  state.runId++;
  input.value = '';
  $('#preview').hidden = true;
  setStatus('');
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  input.focus();
}

// ---------- Screenshots ----------

const IMAGE_NAME_RE = /.(png|jpe?g|webp|gif|bmp|heic|heif|avif)$/i;

// Some phones hand over photos with an empty type (e.g. HEIC), so also trust the file name.
function looksLikeImage(file) {
  return !!file && (file.type.startsWith('image/') || (!file.type && IMAGE_NAME_RE.test(file.name || '')));
}

async function handleImage(file, extraText = '') {
  if (!file) return;
  if (!looksLikeImage(file)) {
    setStatus(t('ocrNotImage'), 'error');
    return;
  }
  const preview = $('#preview');
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  setStatus(t('ocrLoading'));
  try {
    const { readScreenshot } = await import('./ocr.js');
    const text = await readScreenshot(file, (stage, p) => {
      setStatus(stage === 'loading' ? t('ocrLoading') : t('ocrReading', { pct: Math.round(p * 100) }));
    });
    const combined = [extraText, text].filter(Boolean).join('\n');
    if (!combined.trim()) {
      showImageOnly(file);
      return;
    }
    input.value = combined;
    setStatus(t('ocrDone'));
    state.image = file;
    state.imageData = null;
    runCheck(combined, 'image');
  } catch (err) {
    if (err && err.message === 'unsupported-image') {
      setStatus(t('ocrUnsupported'), 'error');
      return;
    }
    // The phone's reader failed (e.g. couldn't download): the AI can still look at it.
    showImageOnly(file);
  }
}

// No text read on the phone: offer the AI, which looks at the picture itself.
function showImageOnly(file) {
  resetFeedback();
  state.runId++;
  state.text = '';
  state.source = 'image';
  state.report = null;
  state.online = undefined;
  state.ai = null;
  state.image = file;
  state.imageData = null;
  setStatus('');
  render({ scroll: true });
}

// ---------- Shares from other apps (installed app) ----------

async function consumeSharedContent() {
  const params = new URLSearchParams(location.search);
  const shared = params.get('shared');
  if (!shared) return;
  history.replaceState(null, '', '/');
  if (shared === 'failed') {
    setStatus(t('sharedFailed'), 'error');
    return;
  }
  try {
    const cache = await caches.open('checkam-share');
    const textRes = await cache.match('/_share/text');
    const imageRes = await cache.match('/_share/image');
    await Promise.all([cache.delete('/_share/text'), cache.delete('/_share/image')]);
    const text = textRes ? await textRes.text() : '';
    if (imageRes) {
      const blob = await imageRes.blob();
      await handleImage(new File([blob], 'shared', { type: blob.type || 'image/png' }), text);
    } else if (text.trim()) {
      input.value = text;
      runCheck(text, 'share');
    }
  } catch {
    setStatus(t('sharedFailed'), 'error');
  }
}

// ---------- Wiring ----------

form.addEventListener('submit', (e) => {
  e.preventDefault();
  runCheck(input.value, 'text');
});

fileInput.addEventListener('change', () => {
  handleImage(fileInput.files[0]);
  fileInput.value = '';
});

// Paste an image anywhere on the page (not only inside the text box).
document.addEventListener('paste', (e) => {
  const item = [...(e.clipboardData?.items || [])].find((i) => i.kind === 'file' && i.type.startsWith('image/'));
  if (item) {
    e.preventDefault();
    handleImage(item.getAsFile());
  }
});

// Drag a screenshot onto the page. Without this the browser would open the
// image itself and leave CheckAm.
const draggingFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
window.addEventListener('dragover', (e) => {
  if (!draggingFiles(e)) return;
  e.preventDefault();
  form.classList.add('dragging');
});
window.addEventListener('dragleave', (e) => {
  if (!e.relatedTarget) form.classList.remove('dragging');
});
window.addEventListener('drop', (e) => {
  if (!draggingFiles(e)) return;
  e.preventDefault();
  form.classList.remove('dragging');
  const file = [...e.dataTransfer.files].find(looksLikeImage) || e.dataTransfer.files[0];
  handleImage(file);
});

for (const btn of document.querySelectorAll('[data-example]')) {
  btn.addEventListener('click', () => {
    input.value = EXAMPLES[btn.dataset.example];
    runCheck(input.value, 'text');
  });
}

for (const btn of document.querySelectorAll('[data-lang]')) {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
}

// Footer report links (general reports, not tied to a result).
function updateContactLinks() {
  for (const a of document.querySelectorAll('[data-contact="whatsapp"]')) a.href = whatsappLink(t('reportGeneralTemplate'));
  for (const a of document.querySelectorAll('[data-contact="email"]')) a.href = emailLink(t('reportSubject'), t('reportGeneralTemplate'));
}

window.addEventListener('pagehide', flushFeedback);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  state.deferredInstall = e;
  $('#install').hidden = false;
});
$('#install-btn').addEventListener('click', async () => {
  const prompt = state.deferredInstall;
  if (!prompt) return;
  state.deferredInstall = null;
  $('#install').hidden = true;
  prompt.prompt();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

state.lang = storage('get', 'checkam-lang') === 'pcm' ? 'pcm' : 'en';
applyLanguage();
consumeSharedContent();
