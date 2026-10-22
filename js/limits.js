import { loadLimits, saveLimits } from './storage.js';

const DEFAULTS = {
  'gemini-2.5-flash-lite': { used: 0, max: 1000 },
  'gemini-2.5-flash':      { used: 0, max: 250 },
  'gemini-2.5-pro':        { used: 0, max: 100 },
  'gemini-2.0-flash':      { used: 0, max: 200 },
  'image':                 { used: 0, max: 100 },
  'voice':                 { used: 0, max: 15 }
};

let limits = { ...DEFAULTS };

export function initLimits() {
  limits = loadLimits(DEFAULTS);
  updateLimitsUI();
}

export function trackUsage(modelOrType) {
  if (limits[modelOrType]) {
    limits[modelOrType].used++;
    saveLimits(limits);
    updateLimitsUI();
  }
}

export function canUse(modelId) {
  const d = limits[modelId];
  if (!d) return true;
  return d.used < d.max;
}

export function getLimit(modelId) {
  return limits[modelId];
}

function updateLimitsUI() {
  const set = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    const data = limits[key];
    if (!data) return;
    el.textContent = `${data.used}/${data.max}`;
    const chip = el.closest('.limit-chip');
    chip.classList.remove('warn', 'danger');
    const ratio = data.used / data.max;
    if (ratio >= 0.9) chip.classList.add('danger');
    else if (ratio >= 0.7) chip.classList.add('warn');
  };
  set('limit-lite', 'gemini-2.5-flash-lite');
  set('limit-flash', 'gemini-2.5-flash');
  set('limit-pro', 'gemini-2.5-pro');
  set('limit-image', 'image');
  set('limit-voice', 'voice');
}