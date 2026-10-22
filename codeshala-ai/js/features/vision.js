import { callGemini } from '../api/gemini-client.js';
import { canUse, trackUsage } from '../limits.js';
import { renderMarkdown } from '../ui/markdown.js';
import { showToast } from '../ui/toast.js';
import { fireConfetti } from '../ui/confetti.js';
import { isValidFileSize, isValidImageType } from '../security.js';
import { MAX_IMAGE_SIZE_MB } from '../config.js';

let isGenerating = false;

export function initVision() {
  const input = document.getElementById('visionFile');
  const dz = document.getElementById('visionDropzone');
  if (!input || !dz) return;

  input.addEventListener('change', onFileSelect);
  dz.addEventListener('dragover', e => {
    e.preventDefault();
    dz.classList.add('dragover');
  });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      onFileSelect();
    }
  });
}

function onFileSelect() {
  const input = document.getElementById('visionFile');
  const file = input.files[0];
  if (!file) return;

  if (!isValidImageType(file)) {
    showToast('⚠️ Sirf image files allowed');
    input.value = '';
    return;
  }
  if (!isValidFileSize(file, MAX_IMAGE_SIZE_MB)) {
    showToast(`⚠️ File ${MAX_IMAGE_SIZE_MB}MB se choti honi chahiye`);
    input.value = '';
    return;
  }

  const dz = document.getElementById('visionDropzone');
  dz.classList.add('has-file');
  document.getElementById('visionDropTitle').textContent = '✅ ' + file.name;
  const preview = document.getElementById('visionPreview');
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

export async function sendVision() {
  if (isGenerating) return;
  const { getApiKey } = await import('../storage.js');
  const apiKey = await getApiKey();
  if (!apiKey) {
    document.getElementById('settingsModal')?.classList.add('show');
    return;
  }

  const file = document.getElementById('visionFile').files[0];
  if (!file) { showToast('⚠️ Pehle image chuno'); return; }
  if (!isValidImageType(file)) { showToast('⚠️ Invalid image type'); return; }
  if (!isValidFileSize(file, MAX_IMAGE_SIZE_MB)) { showToast('⚠️ File too large'); return; }
  if (!canUse('gemini-2.5-flash')) { showToast('⚠️ Flash limit reached'); return; }

  isGenerating = true;
  const btn = document.getElementById('visionBtn');
  const out = document.getElementById('visionOutput');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span> Analyzing...';
  out.innerHTML = '';

  const prompt = document.getElementById('visionPrompt').value.trim() || 'Describe this image in detail.';

  try {
    const base64 = await fileToBase64(file);
    const data = await callGemini('gemini-2.5-flash', {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: file.type, data: base64 } }
        ]
      }]
    });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    out.innerHTML = renderMarkdown(text);
    trackUsage('gemini-2.5-flash');
    fireConfetti(20);
  } catch (err) {
    out.innerHTML = '❌ Error: ' + escapeHtml(err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/></svg> Analyze Image';
    isGenerating = false;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}