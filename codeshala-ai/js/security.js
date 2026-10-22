/**
 * Security utilities - XSS prevention, validation, safe storage
 */

// Sanitize text for safe insertion into HTML
export function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Sanitize a URL - only allow http, https, data (images)
export function sanitizeUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    const allowedProtocols = ['http:', 'https:', 'data:', 'blob:'];
    if (!allowedProtocols.includes(parsed.protocol)) return '';
    // Block javascript: URIs via data: check for images only
    if (parsed.protocol === 'data:' && !url.startsWith('data:image/') && !url.startsWith('data:audio/')) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
}

// Simple encrypted storage using Web Crypto (AES-GCM)
const ENC_PREFIX = 'enc:';
const KEY_STORAGE = '__csk';

async function getCryptoKey() {
  let raw = sessionStorage.getItem(KEY_STORAGE);
  if (!raw) {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await crypto.subtle.exportKey('raw', key);
    raw = btoa(String.fromCharCode(...new Uint8Array(exported)));
    sessionStorage.setItem(KEY_STORAGE, raw);
    return key;
  }
  const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function secureSet(key, value) {
  try {
    const cryptoKey = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const cipher = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      enc.encode(value)
    );
    const buf = new Uint8Array(iv.length + cipher.byteLength);
    buf.set(iv, 0);
    buf.set(new Uint8Array(cipher), iv.length);
    const b64 = btoa(String.fromCharCode(...buf));
    localStorage.setItem(key, ENC_PREFIX + b64);
  } catch (e) {
    console.warn('Secure storage failed, using fallback');
    localStorage.setItem(key, value);
  }
}

export async function secureGet(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  if (!raw.startsWith(ENC_PREFIX)) return raw;
  try {
    const cryptoKey = await getCryptoKey();
    const b64 = raw.slice(ENC_PREFIX.length);
    const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const iv = buf.slice(0, 12);
    const cipher = buf.slice(12);
    const dec = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      cipher
    );
    return new TextDecoder().decode(dec);
  } catch {
    return null;
  }
}

export function secureRemove(key) {
  localStorage.removeItem(key);
}

// Validate API key format (Gemini keys start with AIza)
export function isValidApiKeyFormat(key) {
  return typeof key === 'string' && /^AIza[0-9A-Za-z_\-]{20,}$/.test(key.trim());
}

// Validate file size
export function isValidFileSize(file, maxMB = 10) {
  return file && file.size <= maxMB * 1024 * 1024;
}

// Validate file type (only images for vision)
export function isValidImageType(file) {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
  return file && allowed.includes(file.type);
}

// Debounce to prevent API spam
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}