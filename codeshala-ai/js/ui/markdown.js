import { escapeHtml, sanitizeUrl } from '../security.js';

export function renderMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);

  // Code blocks
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, l, c) =>
    `<pre><code>${c.trim()}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold / italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Links - sanitize URL
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) => {
    const safe = sanitizeUrl(url);
    if (!safe) return label;
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\s*\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>');

  // HR
  html = html.replace(/^---$/gm, '<hr>');

  // Paragraphs
  const parts = html.split(/\n\n+/);
  return parts.map(p => {
    const t = p.trim();
    if (!t) return '';
    if (t.match(/^<(h[1-3]|ul|ol|pre|blockquote|hr)/)) return t;
    return `<p>${t.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}