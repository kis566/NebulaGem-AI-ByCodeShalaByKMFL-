import { callGemini } from '../api/gemini-client.js';
import { canUse, trackUsage } from '../limits.js';
import { showToast } from '../ui/toast.js';
import { fireConfetti } from '../ui/confetti.js';

let isGenerating = false;

export async function sendVoice() {
  if (isGenerating) return;
  const { getApiKey } = await import('../storage.js');
  const apiKey = await getApiKey();
  if (!apiKey) {
    document.getElementById('settingsModal')?.classList.add('show');
    return;
  }
  if (!canUse('voice')) {
    showToast('⚠️ Voice limit reached for today');
    return;
  }

  const text = document.getElementById('voiceText').value.trim();
  const voice = document.getElementById('voiceSelect').value;
  if (!text) return;

  isGenerating = true;
  const btn = document.getElementById('voiceBtn');
  const out = document.getElementById('voiceOutput');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span> Generating...';
  out.innerHTML = '';

  try {
    const data = await callGemini('gemini-2.5-flash-preview-tts', {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
      }
    });

    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (audioData) {
      out.innerHTML = `<audio controls autoplay src="data:${escapeHtml(audioData.mimeType)};base64,${audioData.data}"></audio>`;
      trackUsage('voice');
      fireConfetti(25);
      showToast('🔊 Audio ready!');
    } else {
      out.innerHTML = '⚠️ Audio nahi mila';
    }
  } catch (err) {
    out.innerHTML = '❌ Error: ' + escapeHtml(err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg> Generate Voice';
    isGenerating = false;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}