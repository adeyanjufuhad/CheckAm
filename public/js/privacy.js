// Language toggle for the privacy page. Shares the saved choice with the main app.
import { whatsappLink, emailLink } from './config.js';

const blocks = document.querySelectorAll('[data-lang-block]');
const buttons = document.querySelectorAll('[data-lang]');

function setLang(lang) {
  for (const b of blocks) b.hidden = b.dataset.langBlock !== lang;
  for (const btn of buttons) btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
  document.documentElement.lang = lang;
  try {
    localStorage.setItem('checkam-lang', lang);
  } catch {
    // Storage blocked: the page still works, it just won't remember.
  }
}

for (const btn of buttons) btn.addEventListener('click', () => setLang(btn.dataset.lang));
for (const a of document.querySelectorAll('[data-contact="whatsapp"]')) a.href = whatsappLink('Hi CheckAm, I have a privacy question:\n');
for (const a of document.querySelectorAll('[data-contact="email"]')) a.href = emailLink('CheckAm privacy', '');

let saved = 'en';
try {
  saved = localStorage.getItem('checkam-lang') === 'pcm' ? 'pcm' : 'en';
} catch {
  // Default to English.
}
setLang(saved);
