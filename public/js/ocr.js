// Reads text from a screenshot entirely in the browser (Tesseract.js).
// The image is never uploaded. The reader (~3 MB) downloads only the first
// time someone uses a screenshot, then the browser caches it.

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
const MAX_SIDE = 2000;

let scriptPromise = null;
let workerPromise = null;
let progressHandler = () => {};

function loadScript() {
  if (window.Tesseract) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = TESSERACT_URL;
      s.crossOrigin = 'anonymous';
      s.onload = resolve;
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load screenshot reader'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

function getWorker() {
  if (!workerPromise) {
    workerPromise = window.Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') progressHandler(m.progress);
      },
    }).catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

/**
 * Shrink a screenshot to a JPEG data URL for the AI (only when the person
 * asks). Width up to 1280 and height up to 2800 keeps chat text legible while
 * the upload stays around 0.3–0.8 MB on mobile data.
 */
export async function imageToDataUrl(file) {
  const img = await decodeImage(file);
  const scale = Math.min(1, 1280 / img.width, 2800 / img.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close?.();
  return canvas.toDataURL('image/jpeg', 0.82);
}

/** Decode with createImageBitmap, falling back to an <img> (handles formats like HEIC on Safari). */
async function decodeImage(file) {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } catch {
      throw new Error('unsupported-image');
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Screenshots are often dark mode (light text on dark), which OCR reads badly,
 * and chat bubbles are small. Grayscale, invert if dark, upscale small images.
 */
async function prepareImage(file) {
  const bitmap = await decodeImage(file);
  const scale = Math.min(2, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  g.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const img = g.getImageData(0, 0, w, h);
  const px = img.data;
  let total = 0;
  for (let i = 0; i < px.length; i += 4) {
    const y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = px[i + 1] = px[i + 2] = y;
    total += y;
  }
  if (total / (px.length / 4) < 110) {
    for (let i = 0; i < px.length; i += 4) px[i] = px[i + 1] = px[i + 2] = 255 - px[i];
  }
  g.putImageData(img, 0, 0);
  return canvas;
}

/** onStage('loading' | 'reading', progress 0..1) */
export async function readScreenshot(file, onStage = () => {}) {
  onStage('loading', 0);
  await loadScript();
  const worker = await getWorker();
  progressHandler = (p) => onStage('reading', p);
  onStage('reading', 0);
  const image = await prepareImage(file);
  const { data } = await worker.recognize(image);
  return cleanOcrText(data.text || '');
}

/** Drop chat-app chrome lines ("12:45", "Type a message") that confuse nothing but clutter the box. */
function cleanOcrText(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^\d{1,2}:\d{2}\s*(?:am|pm)?\s*[✓✔vV/]*$/i.test(l) && !/^(?:type a message|message|today|yesterday)$/i.test(l))
    .join('\n');
}
