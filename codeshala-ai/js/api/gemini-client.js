import { API_BASE } from '../config.js';
import { getApiKey } from '../storage.js';

/**
 * Low-level Gemini API client with error handling
 */
export async function callGemini(modelId, body, { signal } = {}) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const res = await fetch(
    `${API_BASE}/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data.error?.message || `HTTP ${res.status}`;
    const isRetryable = res.status === 429 || res.status === 503 || res.status === 500 ||
      /high demand|overloaded|quota|rate limit|unavailable|try again/i.test(err);
    const error = new Error(err);
    error.status = res.status;
    error.retryable = isRetryable;
    throw error;
  }

  return data;
}

/**
 * Try models in fallback chain until one succeeds
 * Returns { text, sources, model }
 */
export async function callWithFallback(chain, buildBody, canUseFn, onSkip) {
  let lastError = null;

  for (const modelId of chain) {
    if (canUseFn && !canUseFn(modelId)) {
      onSkip?.(modelId, 'limit');
      continue;
    }
    try {
      const data = await callGemini(modelId, buildBody());
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const sources = extractSources(data);
      return { text, sources, model: modelId };
    } catch (err) {
      lastError = err;
      if (!err.retryable) break;
      onSkip?.(modelId, err.message);
    }
  }

  throw lastError || new Error('All models failed');
}

export function extractSources(data) {
  const gm = data.candidates?.[0]?.groundingMetadata;
  if (!gm?.groundingChunks) return [];
  return gm.groundingChunks
    .filter(c => c.web)
    .map(c => ({ title: c.web.title || c.web.uri, uri: c.web.uri }))
    .slice(0, 6);
}

export async function verifyApiKey(key) {
  const res = await fetch(`${API_BASE}/models?key=${encodeURIComponent(key)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Invalid key');
  return data;
}