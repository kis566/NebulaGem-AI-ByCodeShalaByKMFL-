import { STORAGE_KEYS } from './config.js';
import { secureSet, secureGet, secureRemove } from './security.js';

// API Key (encrypted)
export async function saveApiKey(key) {
  await secureSet(STORAGE_KEYS.API_KEY, key);
}
export async function getApiKey() {
  return await secureGet(STORAGE_KEYS.API_KEY);
}
export async function removeApiKey() {
  secureRemove(STORAGE_KEYS.API_KEY);
}

// Search mode
export function getSearchMode() {
  const v = localStorage.getItem(STORAGE_KEYS.SEARCH_MODE);
  return v !== 'false';
}
export function setSearchMode(v) {
  localStorage.setItem(STORAGE_KEYS.SEARCH_MODE, String(v));
}

// Limits
export function loadLimits(defaults) {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LIMITS);
    const savedDate = localStorage.getItem(STORAGE_KEYS.LIMITS_DATE);
    const today = new Date().toDateString();
    if (saved && savedDate === today) {
      return JSON.parse(saved);
    }
  } catch {}
  return defaults;
}
export function saveLimits(limits) {
  localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(limits));
  localStorage.setItem(STORAGE_KEYS.LIMITS_DATE, new Date().toDateString());
}

// Conversations (safe JSON)
export function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function saveConversations(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage full', e);
  }
}

// Gallery
export function loadGallery() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GALLERY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
export function saveGallery(gallery) {
  try {
    // Only keep last 12 to prevent overflow
    const toSave = gallery.slice(0, 12);
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Gallery storage full', e);
  }
}