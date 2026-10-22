import { FALLBACKS } from '../config.js';
import { callWithFallback } from '../api/gemini-client.js';
import { canUse, trackUsage } from '../limits.js';
import { renderMarkdown } from '../ui/markdown.js';
import { showToast } from '../ui/toast.js';
import { fireConfetti } from '../ui/confetti.js';
import { getSearchModeValue } from '../ui/topbar.js';
import { escapeHtml, sanitizeUrl } from '../security.js';
import * as Conv from './conversations.js';

const isGenerating = { chat: false, search: false, write: false, deep: false };

function isSearchQuery(text) {
  const t = text.toLowerCase();
  const keywords = [
    'latest', 'current', 'today', 'now', 'news', 'update', 'who is',
    'what is the current', 'when did', 'price of', 'stock', 'weather',
    'match', 'score', 'ipl', 'election', 'president', 'pm of',
    'prime minister', 'cm of', 'ceo of', 'release date', '2025', '2026',
    'search', 'google', 'kisne', 'kaun', 'abhi', 'aaj', 'taaza'
  ];
  return keywords.some(k => t.includes(k));
}

function renderMessageHTML(role, content) {
  const avatar = role === 'user'
    ? '<div class="msg-avatar user">YOU</div>'
    : '<div class="msg-avatar assistant">⚡</div>';
  const rendered = role === 'assistant'
    ? renderMarkdown(content)
    : escapeHtml(content).replace(/\n/g, '<br>');
  const actions = role === 'assistant' ? `
    <div class="msg-actions">
      <button class="msg-action-btn" data-copy-msg title="Copy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </button>
    </div>` : '';
  return `<div class="message" data-role="${role}">
    <div class="message-inner">
      ${avatar}
      <div class="msg-content">${rendered}${actions}</div>
    </div>
  </div>`;
}

function sourcesHTML(sources) {
  return `
    <div class="sources-block">
      <div class="sources-title">🔗 Sources</div>
      ${sources.map((s, i) => {
        const safeUrl = sanitizeUrl(s.uri);
        const title = escapeHtml(s.title || s.uri);
        return `<div class="source-item">
          <span class="source-num">${i + 1}</span>
          ${safeUrl ? `<a class="source-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${title}</a>` : title}
        </div>`;
      }).join('')}
    </div>`;
}

function appendMessage(tool, role, content) {
  const container = document.getElementById(tool + 'Messages');
  const welcome = document.getElementById(tool + 'Welcome');
  if (!container) return null;
  welcome?.classList.add('hidden');
  container.classList.remove('hidden');
  container.insertAdjacentHTML('beforeend', renderMessageHTML(role, content));
  scrollBottom(tool);
  return container.lastElementChild;
}

function scrollBottom(tool) {
  const map = { chat: 'chatContainer', search: 'searchContainer', write: 'writeContainer', deep: 'deepContainer' };
  const el = document.getElementById(map[tool]);
  if (el) requestAnimationFrame(() => el.scrollTop = el.scrollHeight);
}

function renderMessages(tool) {
  const container = document.getElementById(tool + 'Messages');
  const welcome = document.getElementById(tool + 'Welcome');
  if (!container) return;
  const msgs = Conv.getMessages(tool);
  if (msgs.length === 0) {
    welcome?.classList.remove('hidden');
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }
  welcome?.classList.add('hidden');
  container.classList.remove('hidden');
  container.innerHTML = msgs.map(m => {
    let html = renderMessageHTML(m.role, m.content);
    if (m.sources?.length) {
      html = html.replace('</div></div></div>', sourcesHTML(m.sources) + '</div></div></div>');
    }
    return html;
  }).join('');
  scrollBottom(tool);
}

async function streamText(tool, element, fullText) {
  const chunk = 4;
  let i = 0;
  element.innerHTML = '<span class="typing-cursor"></span>';
  return new Promise(resolve => {
    const iv = setInterval(() => {
      if (i >= fullText.length) {
        clearInterval(iv);
        element.innerHTML = renderMarkdown(fullText);
        element.insertAdjacentHTML('beforeend', `
          <div class="msg-actions">
            <button class="msg-action-btn" data-copy-msg title="Copy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        `);
        resolve();
        return;
      }
      i += chunk;
      element.innerHTML = renderMarkdown(fullText.slice(0, i)) + '<span class="typing-cursor"></span>';
      scrollBottom(tool);
    }, 12);
  });
}

export async function sendChatLike(tool) {
  if (isGenerating[tool]) return;

  const inputMap = { chat: 'chatInput', search: 'searchInput', write: 'writeInput', deep: 'deepInput' };
  const input = document.getElementById(inputMap[tool]);
  const text = input?.value.trim();
  if (!text) return;

  const { getApiKey } = await import('../storage.js');
  const apiKey = await getApiKey();
  if (!apiKey) {
    document.getElementById('settingsModal')?.classList.add('show');
    return;
  }

  input.value = '';
  input.style.height = 'auto';
  updateSendButton(input, tool + 'Send');

  if (!Conv.getCurrentId(tool)) {
    Conv.createConversation(tool, text);
  }

  const msgs = Conv.getMessages(tool);
  msgs.push({ role: 'user', content: text, timestamp: Date.now() });
  Conv.setMessages(tool, msgs);

  appendMessage(tool, 'user', text);
  Conv.saveAll();

  isGenerating[tool] = true;
  const loadingEl = appendMessage(tool, 'assistant', '');
  loadingEl.querySelector('.msg-content').innerHTML =
    '<div class="loading-dots"><span></span><span></span><span></span></div>';
  scrollBottom(tool);

  const useSearch = tool === 'search'
    ? getSearchModeValue()
    : (getSearchModeValue() && isSearchQuery(text));

  if (useSearch) {
    const wb = document.getElementById('warnBanner');
    wb.textContent = '🔎 Searching Google for fresh results...';
    wb.classList.add('show');
  }

  const chain = FALLBACKS[tool] || ['gemini-2.5-flash'];

  try {
    const result = await callWithFallback(
      chain,
      () => {
        const body = {
          contents: msgs.slice(-10).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }))
        };
        if (useSearch) body.tools = [{ googleSearch: {} }];
        return body;
      },
      canUse
    );

    document.getElementById('warnBanner').classList.remove('show');
    loadingEl.remove();

    if (!result.text) {
      appendMessage(tool, 'assistant', '❌ Koi response nahi mila');
      isGenerating[tool] = false;
      return;
    }

    if (result.model !== chain[0]) {
      showToast(`⚡ Used ${result.model} (fallback)`);
    } else if (result.sources.length > 0) {
      showToast(`🌐 ${result.sources.length} sources found`);
    }

    const assistantEl = appendMessage(tool, 'assistant', '');
    const contentEl = assistantEl.querySelector('.msg-content');
    await streamText(tool, contentEl, result.text);

    if (result.sources.length > 0) {
      assistantEl.querySelector('.msg-content').insertAdjacentHTML(
        'beforeend',
        sourcesHTML(result.sources)
      );
      scrollBottom(tool);
    }

    const finalMsgs = Conv.getMessages(tool);
    finalMsgs.push({
      role: 'assistant',
      content: result.text,
      sources: result.sources,
      model: result.model,
      timestamp: Date.now()
    });
    Conv.setMessages(tool, finalMsgs);
    trackUsage(result.model);
    Conv.saveAll();
    Conv.renderHistory(tool);

    if (result.sources.length > 0) fireConfetti(20);
  } catch (err) {
    document.getElementById('warnBanner').classList.remove('show');
    loadingEl.remove();
    if (err.message === 'API_KEY_MISSING') {
      document.getElementById('settingsModal')?.classList.add('show');
    } else {
      appendMessage(tool, 'assistant', `❌ **Error:** ${escapeHtml(err.message)}`);
      showToast('❌ Error occurred');
    }
  } finally {
    isGenerating[tool] = false;
  }
}

function updateSendButton(el, btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const hasText = !!el.value.trim();
  btn.disabled = !hasText;
  btn.classList.toggle('active', hasText);
}

export function handleInput(el, btnId) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  updateSendButton(el, btnId);
}

export function handleKeydown(e, tool) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const btnId = tool + 'Send';
    if (!document.getElementById(btnId)?.disabled) {
      sendChatLike(tool);
    }
  }
}

export { renderMessages };