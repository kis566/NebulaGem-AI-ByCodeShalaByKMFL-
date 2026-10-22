export function fireConfetti(count = 30) {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  const colors = ['#8b5cf6', '#ec4899', '#22d3ee', '#fb923c', '#34d399', '#fbbf24'];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDuration = (2 + Math.random() * 2) + 's';
    c.style.animationDelay = (Math.random() * 0.3) + 's';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    c.style.width = (6 + Math.random() * 8) + 'px';
    c.style.height = (6 + Math.random() * 8) + 'px';
    container.appendChild(c);
    setTimeout(() => c.remove(), 4500);
  }
}