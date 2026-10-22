import { getSearchMode, setSearchMode } from '../storage.js';
import { showToast } from './toast.js';

let searchMode = true;

export function initSearchToggle() {
  searchMode = getSearchMode();
  updateSearchToggleUI();
  document.getElementById('searchToggle')?.addEventListener('click', () => {
    searchMode = !searchMode;
    setSearchMode(searchMode);
    updateSearchToggleUI();
    showToast(searchMode ? '🌐 Google Search ON' : '🔒 Search OFF (faster)');
  });
}

export function getSearchModeValue() { return searchMode; }

function updateSearchToggleUI() {
  const btn = document.getElementById('searchToggle');
  if (btn) btn.classList.toggle('search-on', searchMode);
}