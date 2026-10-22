import { TOOL_CONFIG, SUGGESTIONS } from './config.js';
import { initLimits } from './limits.js';
import * as Conv from './features/conversations.js';
import { renderMessages, sendChatLike, handleInput, handleKeydown } from './features/chat.js';
import { sendCode, copyCodeOutput } from './features/code.js';
import { initImage, sendImage, downloadImage } from './features/image.js';
import { initVision, sendVision } from './features/vision.js';
import { sendVoice } from './features/voice.js';
import { initSettings, openSettings, closeSettings, saveKeyHandler } from './settings.js';
import { initSearchToggle, getSearchModeValue } from './ui/topbar.js';
import { toggleSidebar } from './ui/sidebar.js';
import { showToast } from './ui/toast.js';
import { escapeHtml } from './security.js';

let currentTool = 'dashboard';

// ============ INIT ============
async function init() {
  initLimits();
  Conv.initConversations();
  initSearchToggle();
  initImage();
  initVision();
  await initSettings();
  renderDashboard();
  renderSuggestions();
  bindEvents();
  updateDocumentTitle();
}

// ============ DASHBOARD ============
function renderDashboard() {
  const grid = document.getElementById('toolsGrid');
  if (!grid) return;
  grid.innerHTML = Object.entries(TOOL_CONFIG)
    .filter(([k]) => k !== 'dashboard')
    .map(([tool, cfg], i) => `
      <button class="tool-card" style="--card-color: ${cfg.color}; animation-delay: ${0.05 + i * 0.05}s;" data-tool="${tool}">
        <div class="tc-head">
          <div class="tc-icon">${cfg.emoji}</div>
          <span class="tc-limit">${cfg.limit}/day</span>
        </div>
        <div class="tc-body">
          <div class="tc-title">${cfg.name}</div>
          <div class="tc-desc">${getToolDesc(tool)}</div>
        </div>
        <div class="tc-foot">Open <span>→</span></div>
      </button>
    `).join('');
}

function getToolDesc(tool) {
  const map = {
    chat: 'Fast conversations, quick Q&A, daily help',
    code: 'Split view — prompt + code, any language',
    search: 'Real Google search with live sources',
    write: 'Essays, poems, emails, captions',
    image: 'Nano Banana — gallery with download',
    vision: 'Photo upload — objects, text, scenes',
    voice: 'Text to speech with 5 voices',
    deep: 'Pro model for complex problems'
  };
  return map[tool] || '';
}

function renderSuggestions() {
  document.querySelectorAll('.suggestions[data-tool]').forEach(el => {
    const tool = el.dataset.tool;
    const items = SUGGESTIONS[tool] || [];
    el.innerHTML = items.map(s => `
      <button class="suggestion" data-suggest-tool="${tool}" data-suggest-prompt="${escapeHtml(s.prompt)}">
        <div class="s-title">${s.icon || ''} ${escapeHtml(s.title)}</div>
        <div class="s-desc">${escapeHtml(s.desc)}</div>
      </button>
    `).join('');
  });

  document.querySelectorAll('.chip-row[data-tool]').forEach(el => {
    const tool = el.dataset.tool;
    const items = SUGGESTIONS[tool] || [];
    el.innerHTML = items.map(s => `
      <button class="suggestion" data-suggest-tool="${tool}" data-suggest-prompt="${escapeHtml(s.prompt)}">
        <div class="s-title" style="font-size:0.75rem;">${escapeHtml(s.title)}</div>
      </button>
    `).join('');
  });
}

// ============ TOOL SWITCHING ============
function openTool(tool) {
  currentTool = tool;

  document.querySelectorAll('.tool-nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.tool-nav-item[data-tool="${tool}"]`)?.classList.add('active');

  document.querySelectorAll('.section-view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + tool)?.classList.add('active');

  const cfg = TOOL_CONFIG[tool];
  if (cfg) {
    document.getElementById('sectionEmoji').textContent = cfg.emoji;
    document.getElementById('sectionName').textContent = cfg.name;
    const badge = document.getElementById('sectionBadge');
    badge.textContent = cfg.badge;
    badge.style.setProperty('--tool-color', cfg.color);
    document.documentElement.style.setProperty('--tool-color', cfg.color);
  }

  if (['chat', 'search', 'write', 'deep'].includes(tool)) {
    renderMessages(tool);
  }

  Conv.renderHistory(tool);

  if (window.innerWidth < 768) toggleSidebar();
  updateDocumentTitle();
}

function updateDocumentTitle() {
  const cfg = TOOL_CONFIG[currentTool];
  document.title = cfg ? `${cfg.name} · CodeShalaByKMFL AI` : 'CodeShalaByKMFL AI';
}

// ============ NEW CHAT ============
function newChat() {
  const tool = currentTool;
  if (['chat', 'search', 'write', 'deep'].includes(tool)) {
    Conv.resetTool(tool);
    const msgsEl = document.getElementById(tool + 'Messages');
    const welcomeEl = document.getElementById(tool + 'Welcome');
    if (msgsEl) { msgsEl.innerHTML = ''; msgsEl.classList.add('hidden'); }
    if (welcomeEl) welcomeEl.classList.remove('hidden');
    const inputEl = document.getElementById(tool + 'Input');
    if (inputEl) { inputEl.value = ''; handleInput(inputEl, tool + 'Send'); }
  }
  if (window.innerWidth < 768) toggleSidebar();
  Conv.renderHistory(tool);
}

// ============ SUGGESTION ============
function useSuggestion(tool, text) {
  const inputMap = {
    chat: 'chatInput', code: 'codePrompt', search: 'searchInput',
    write: 'writeInput', deep: 'deepInput', image: 'imageInput'
  };
  const input = document.getElementById(inputMap[tool]);
  if (!input) return;
  input.value = text;
  handleInput(input, tool + 'Send');
  input.focus();
}

// ============ EVENT BINDING ============
function bindEvents() {
  // Data-action buttons
  document.addEventListener('click', async (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      switch (action) {
        case 'toggle-sidebar': toggleSidebar(); break;
        case 'open-settings': openSettings(); break;
        case 'close-settings': closeSettings(); break;
        case 'save-key': await saveKeyHandler(); break;
        case 'copy-code': copyCodeOutput(); break;
        case 'new-chat': newChat(); break;
      }
      return;
    }

    // Tool nav
    const navItem = e.target.closest('.tool-nav-item');
    if (navItem) { openTool(navItem.dataset.tool); return; }

    // Tool card
    const card = e.target.closest('.tool-card');
    if (card) { openTool(card.dataset.tool); return; }

    // Send buttons
    const sendBtn = e.target.closest('[data-send]');
    if (sendBtn) {
      const tool = sendBtn.dataset.send;
      await handleSend(tool);
      return;
    }

    // Suggestions
    const sug = e.target.closest('[data-suggest-prompt]');
    if (sug) {
      useSuggestion(sug.dataset.suggestTool, sug.dataset.suggestPrompt);
      return;
    }

    // Copy message
    if (e.target.closest('[data-copy-msg]')) {
      const btn = e.target.closest('[data-copy-msg]');
      const content = btn.closest('.msg-content');
      if (content) {
        navigator.clipboard.writeText(content.innerText.replace(/\n\n+/g, '\n\n').trim());
        showToast('📋 Copied!');
      }
      return;
    }

    // Download image
    const dlBtn = e.target.closest('[data-download-id]');
    if (dlBtn) { downloadImage(dlBtn.dataset.downloadId); return; }

    // Conversation click
    const convItem = e.target.closest('[data-conv-id]');
    if (convItem && !e.target.closest('[data-del-id]')) {
      const id = convItem.dataset.convId;
      if (Conv.openConversation(currentTool, id)) {
        renderMessages(currentTool);
        Conv.renderHistory(currentTool);
        if (window.innerWidth < 768) toggleSidebar();
      }
      return;
    }

    // Delete conversation
    const delBtn = e.target.closest('[data-del-id]');
    if (delBtn) {
      e.stopPropagation();
      Conv.deleteConversation(currentTool, delBtn.dataset.delId);
      if (!Conv.getCurrentId(currentTool)) {
        const tool = currentTool;
        document.getElementById(tool + 'Messages').innerHTML = '';
        document.getElementById(tool + 'Messages').classList.add('hidden');
        document.getElementById(tool + 'Welcome')?.classList.remove('hidden');
      }
      Conv.renderHistory(currentTool);
      showToast('🗑️ Chat deleted');
      return;
    }
  });

  // Input handling
  document.querySelectorAll('textarea[data-tool]').forEach(ta => {
    ta.addEventListener('input', () => handleInput(ta, ta.dataset.tool + 'Send'));
    ta.addEventListener('keydown', (e) => handleKeydown(e, ta.dataset.tool));
  });

  // Modal backdrop
  document.getElementById('settingsModal')?.addEventListener('click', e => {
    if (e.target.id === 'settingsModal') closeSettings();
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSettings();
  });
}

async function handleSend(tool) {
  switch (tool) {
    case 'chat':
    case 'search':
    case 'write':
    case 'deep':
      await sendChatLike(tool);
      break;
    case 'code': await sendCode(); break;
    case 'image': await sendImage(); break;
    case 'vision': await sendVision(); break;
    case 'voice': await sendVoice(); break;
  }
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}