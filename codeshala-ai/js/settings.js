import { verifyApiKey } from './api/gemini-client.js';
import { saveApiKey, getApiKey } from './storage.js';
import { isValidApiKeyFormat } from './security.js';
import { showToast } from './ui/toast.js';
import { fireConfetti } from './ui/confetti.js';

export async function initSettings() {
  const saved = await getApiKey();
  if (saved) {
    document.getElementById('apiKeyInput').value = saved;
    updateKeyStatus(true);
  } else {
    setTimeout(() => openSettings(), 700);
  }
}

export function openSettings() {
  document.getElementById('settingsModal').classList.add('show');
}

export function closeSettings() {
  document.getElementById('settingsModal').classList.remove('show');
}

export async function saveKeyHandler() {
  const input = document.getElementById('apiKeyInput');
  const key = input.value.trim();
  if (!key) return;

  if (!isValidApiKeyFormat(key)) {
    updateKeyStatus(false, 'Invalid format (should start with AIza...)');
    showToast('⚠️ Invalid key format');
    return;
  }

  const btn = document.getElementById('saveKeyBtn');
  btn.disabled = true;
  btn.textContent = 'Verifying...';

  try {
    const data = await verifyApiKey(key);
    await saveApiKey(key);
    updateKeyStatus(true, null, data.models?.length || 0);
    showToast(`✅ Connected · ${data.models?.length || 0} models`);
    fireConfetti(30);
    setTimeout(() => {
      closeSettings();
      btn.disabled = false;
      btn.textContent = 'Save & Verify';
    }, 700);
  } catch (err) {
    updateKeyStatus(false, err.message);
    btn.disabled = false;
    btn.textContent = 'Save & Verify';
  }
}

function updateKeyStatus(active, error = null, count = 0) {
  const dot = document.getElementById('keyDot');
  const text = document.getElementById('keyStatusText');
  if (!dot || !text) return;
  if (active) {
    dot.classList.add('active');
    text.textContent = `Connected · ${count} models`;
    text.style.color = 'var(--text-2)';
  } else {
    dot.classList.remove('active');
    text.textContent = error ? `Error: ${error}` : 'Not connected';
    text.style.color = error ? '#f87171' : 'var(--text-2)';
  }
}