export const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const STORAGE_KEYS = {
  API_KEY: 'codeshala_api_key',
  LIMITS: 'codeshala_limits',
  LIMITS_DATE: 'codeshala_limits_date',
  CONVERSATIONS: 'codeshala_conv_v3',
  GALLERY: 'codeshala_gallery',
  SEARCH_MODE: 'codeshala_search_mode'
};

export const TOOL_CONFIG = {
  dashboard: { emoji: '🏠', name: 'Dashboard', color: '#8b5cf6', badge: 'Ready', model: null, limit: 0 },
  chat:      { emoji: '💬', name: 'AI Chat',    color: '#a78bfa', badge: 'Flash-Lite', model: 'gemini-2.5-flash-lite', limit: 1000 },
  code:      { emoji: '💻', name: 'Code Studio', color: '#22d3ee', badge: 'Flash', model: 'gemini-2.5-flash', limit: 250 },
  search:    { emoji: '🔍', name: 'Search',      color: '#34d399', badge: 'Live', model: 'gemini-2.5-flash', limit: 250 },
  write:     { emoji: '✍️', name: 'Writing',     color: '#f472b6', badge: 'Flash', model: 'gemini-2.5-flash', limit: 250 },
  image:     { emoji: '🎨', name: 'Image Gen',   color: '#fb923c', badge: 'Nano Banana', model: 'gemini-2.5-flash-image', limit: 100 },
  vision:    { emoji: '👁️', name: 'Vision AI',   color: '#60a5fa', badge: 'Flash', model: 'gemini-2.5-flash', limit: 250 },
  voice:     { emoji: '🔊', name: 'Voice Gen',   color: '#fbbf24', badge: 'TTS', model: 'gemini-2.5-flash-preview-tts', limit: 15 },
  deep:      { emoji: '🧠', name: 'Deep Think',  color: '#8b5cf6', badge: 'Pro', model: 'gemini-2.5-pro', limit: 100 }
};

export const FALLBACKS = {
  chat:   ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'],
  code:   ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'],
  search: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'],
  write:  ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'],
  deep:   ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash']
};

export const SUGGESTIONS = {
  chat: [
    { icon: '📚', title: 'Explain a concept', desc: 'Quantum computing in simple Hindi', prompt: 'Explain quantum computing in simple terms' },
    { icon: '😴', title: 'Daily tips', desc: '5 tips for better sleep', prompt: 'Give me 5 tips for better sleep' },
    { icon: '🤖', title: 'Concept', desc: 'Difference between AI and ML', prompt: 'What is the difference between AI and ML?' },
    { icon: '🚀', title: 'Fun fact', desc: 'Fun fact about space', prompt: 'Tell me a fun fact about space' }
  ],
  search: [
    { icon: '🇮🇳', title: 'PM of India', desc: 'Current PM with sources', prompt: 'Who is the current PM of India?' },
    { icon: '🏏', title: 'Virat Kohli', desc: 'Latest stats and news', prompt: 'Virat Kohli latest stats and news 2026' },
    { icon: '💰', title: 'Bitcoin price', desc: 'Current price today', prompt: 'Bitcoin price today in India' },
    { icon: '🚀', title: 'ISRO news', desc: 'Latest ISRO missions', prompt: 'ISRO latest mission 2026' }
  ],
  write: [
    { icon: '🌧️', title: 'Monsoon poem', desc: 'Hindi poetry on monsoon', prompt: 'Write a beautiful poem about monsoon in Hindi' },
    { icon: '📧', title: 'Job email', desc: 'Professional job application', prompt: 'Write a professional job application email' },
    { icon: '📖', title: 'Short story', desc: 'Story about a lighthouse', prompt: 'Write a short story about a lonely lighthouse' },
    { icon: '📸', title: 'IG caption', desc: 'Travel photo caption', prompt: 'Write an Instagram caption for a travel photo' }
  ],
  deep: [
    { icon: '🏗️', title: 'System design', desc: 'Scalable chat app architecture', prompt: 'Design a scalable architecture for a chat application' },
    { icon: '⚖️', title: 'Comparison', desc: 'Microservices vs Monolith', prompt: 'Analyze pros and cons of microservices vs monolith' },
    { icon: '🤖', title: 'Deep concept', desc: 'How transformers work', prompt: 'Explain how transformer neural networks work in detail' }
  ],
  code: [
    { title: 'Reverse string', prompt: 'Write a function to reverse a string' },
    { title: 'REST API', prompt: 'Create a REST API endpoint in Node.js' },
    { title: 'Sort objects', prompt: 'Sort an array of objects by key' }
  ]
};

export const IMAGE_ACCEPT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE_MB = 10;