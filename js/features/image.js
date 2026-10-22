import { callGemini } from '../api/gemini-client.js';
import { canUse, trackUsage } from '../limits.js';
import { showToast } from '../ui/toast.js';
import { fireConfetti } from '../ui/confetti.js';
import { escapeHtml } from '../security.js';
import { loadGallery, saveGallery } from '../storage.js';

let imageGallery = [];
let isGenerating = false;

export function initImage() {
  imageGallery = loadGallery();
  renderGallery();
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  if (imageGallery.length === 0) {
    grid.innerHTML = `
      <div class="gallery-empty">
        <span class="ge-icon">🎨</span>
        <div class="ge-title">Abhi koi image nahi hai</div>
        <div class="ge-desc">Neeche prompt likho aur pehli image banao</div>
      </div>`;
    return;
  }
  grid.innerHTML = imageGallery.map(img => `
    <div class="gallery-item">
      <img src="${img.src}" alt="${escapeHtml(img.prompt)}">
      <div class="gi-overlay">
        <button class="gi-btn" data-download-id="${escapeHtml(img.id)}" title="Download">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function downloadImage(id) {
  const img = imageGallery.find(i => i.id === id);
  if (!img) return;
  const a = document.createElement('a');
  a.href = img.src;
  a.download = 'codeshala-' + id + '.png';
  a.click();
}

export async function sendImage() {
  if (isGenerating) return;
  const { getApiKey } = await import('../storage.js');
  const apiKey = await getApiKey();
  if (!apiKey) {
    document.getElementById('settingsModal')?.classList.add('show');
    return;
  }
  if (!canUse('image')) {
    showToast('⚠️ Image limit reached for today');
    return;
  }

  const input = document.getElementById('imageInput');
  const prompt = input.value.trim();
  if (!prompt) return;
  input.value = '';
  input.style.height = 'auto';

  isGenerating = true;
  const grid = document.getElementById('galleryGrid');
  grid.querySelector('.gallery-empty')?.remove();

  const loadId = 'load-' + Date.now();
  grid.insertAdjacentHTML('afterbegin', `
    <div class="gallery-item" id="${loadId}" style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--text-3);">
      <div class="loading-dots" style="transform:scale(1.5);"><span></span><span></span><span></span></div>
      <div style="font-size:0.78rem;">🎨 Image ban rahi hai...</div>
    </div>
  `);

  try {
    const data = await callGemini('gemini-2.5-flash-image', {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
    });

    const parts = data.candidates?.[0]?.content?.parts || [];
    let found = false;
    parts.forEach(p => {
      if (p.inlineData) {
        const src = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
        document.getElementById(loadId)?.remove();
        const id = Date.now().toString();
        imageGallery.unshift({ id, src, prompt, timestamp: Date.now() });
        saveGallery(imageGallery);
        renderGallery();
        found = true;
      }
    });

    if (!found) {
      document.getElementById(loadId)?.remove();
      showToast('⚠️ Image generate nahi hui');
    } else {
      trackUsage('image');
      fireConfetti(40);
      showToast('🎨 Image ready!');
    }
  } catch (err) {
    document.getElementById(loadId)?.remove();
    showToast('❌ ' + err.message);
  } finally {
    isGenerating = false;
  }
}

export { downloadImage };