import { callGemini } from '../api/gemini-client.js';
import { canUse, trackUsage } from '../limits.js';
import { renderMarkdown } from '../ui/markdown.js';
import { showToast } from '../ui/toast.js';
import { fireConfetti } from '../ui/confetti.js';

let isGenerating = false;

export async function sendCode() {
  if (isGenerating) return;
  const { getApiKey } = await import('../storage.js');
  const apiKey = await getApiKey();
  if (!apiKey) {
    document.getElementById('settingsModal')?.classList.add('show');
    return;
  }

  const prompt = document.getElementById('codePrompt').value.trim();
  const lang = document.getElementById('codeLang').value;
  if (!prompt) return;

  const btn = document.getElementById('codeBtn');
  const out = document.getElementById('codeOutput');
  const note = document.getElementById('codeNote');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span> Generating...';
  out.textContent = '';
  note.innerHTML = '';
  isGenerating = true;

  const chain = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];
  let result = null;
  let lastError = null;

  for (const model of chain) {
    if (!canUse(model)) continue;
    try {
      const fullPrompt = `Write ${lang} code for: ${prompt}\n\nProvide the code in a code block, then a brief explanation below.`;
      const data = await callGemini(model, {
        contents: [{ parts: [{ text: fullPrompt }] }]
      });
      result = {
        text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        model
      };
      break;
    } catch (err) {
      lastError = err;
      if (!err.retryable) break;
    }
  }

  if (!result) {
    out.textContent = '❌ Error: ' + (lastError?.message || 'All models failed');
    btn.disabled = false;
    btn.innerHTML = 'Generate Code';
    isGenerating = false;
    return;
  }

  const codeMatch = result.text.match(/```(?:\w+)?\n?([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : result.text;
  const explanation = result.text.replace(/```[\s\S]*?```/g, '').trim();

  out.textContent = '';
  const chunk = 6;
  let i = 0;
  await new Promise(r => {
    const iv = setInterval(() => {
      if (i >= code.length) { clearInterval(iv); r(); return; }
      i += chunk;
      out.textContent = code.slice(0, i);
    }, 10);
  });

  if (explanation) note.innerHTML = renderMarkdown(explanation);
  trackUsage(result.model);
  fireConfetti(25);
  showToast('✅ Code generated!');

  btn.disabled = false;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> Generate Code';
  isGenerating = false;
}

export function copyCodeOutput() {
  const code = document.getElementById('codeOutput').textContent;
  if (!code) return;
  navigator.clipboard.writeText(code);
  showToast('📋 Code copied!');
}