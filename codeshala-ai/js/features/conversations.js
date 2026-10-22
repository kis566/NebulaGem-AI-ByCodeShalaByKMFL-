import { loadConversations, saveConversations as persist } from '../storage.js';
import { escapeHtml } from '../security.js';

let conversations = { chat: {}, search: {}, write: {}, deep: {} };
let conversationMetas = { chat: [], search: [], write: [], deep: [] };
let currentConvIds = { chat: null, search: null, write: null, deep: null };

export function initConversations() {
  const saved = loadConversations();
  if (saved) {
    conversations = saved.conversations || conversations;
    conversationMetas = saved.metas || conversationMetas;
    currentConvIds = saved.current || currentConvIds;
  }
  renderHistory();
}

export function saveAll() {
  persist({ conversations, metas: conversationMetas, current: currentConvIds });
}

export function getCurrentId(tool) { return currentConvIds[tool]; }
export function setCurrentId(tool, id) { currentConvIds[tool] = id; }

export function getMessages(tool) {
  const id = currentConvIds[tool];
  if (!id) return [];
  return conversations[tool]?.[id] || [];
}

export function setMessages(tool, msgs) {
  const id = currentConvIds[tool];
  if (!id) return;
  if (!conversations[tool]) conversations[tool] = {};
  conversations[tool][id] = msgs;
}

export function createConversation(tool, firstMessage) {
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  currentConvIds[tool] = id;
  if (!conversations[tool]) conversations[tool] = {};
  conversations[tool][id] = [];
  if (!conversationMetas[tool]) conversationMetas[tool] = [];
  conversationMetas[tool].unshift({
    id,
    title: firstMessage.slice(0, 45) + (firstMessage.length > 45 ? '...' : ''),
    timestamp: Date.now()
  });
  saveAll();
  return id;
}

export function deleteConversation(tool, id) {
  if (!conversationMetas[tool]) return;
  conversationMetas[tool] = conversationMetas[tool].filter(m => m.id !== id);
  if (conversations[tool]) delete conversations[tool][id];
  if (currentConvIds[tool] === id) {
    currentConvIds[tool] = null;
  }
  saveAll();
}

export function openConversation(tool, id) {
  if (!conversations[tool]?.[id]) return false;
  currentConvIds[tool] = id;
  saveAll();
  return true;
}

export function getMetas(tool) { return conversationMetas[tool] || []; }

export function renderHistory(currentTool) {
  const list = document.getElementById('chatHistoryList');
  const label = document.getElementById('historyLabel');
  if (!list || !label) return;

  if (currentTool === 'dashboard' || !['chat', 'search', 'write', 'deep'].includes(currentTool)) {
    label.style.display = 'none';
    list.innerHTML = '';
    return;
  }

  label.style.display = 'block';
  const metas = conversationMetas[currentTool] || [];
  if (metas.length === 0) {
    list.innerHTML = '<div style="padding:12px;font-size:0.75rem;color:var(--text-4);text-align:center;font-style:italic;">Koi chat nahi hai</div>';
    return;
  }

  list.innerHTML = metas.map(m => `
    <div class="chat-history-item ${m.id === currentConvIds[currentTool] ? 'active' : ''}" data-conv-id="${escapeHtml(m.id)}">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;opacity:0.6;"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      <span class="title">${escapeHtml(m.title)}</span>
      <button class="del-btn" data-del-id="${escapeHtml(m.id)}" aria-label="Delete">×</button>
    </div>
  `).join('');
}

export function resetTool(tool) {
  currentConvIds[tool] = null;
  saveAll();
}