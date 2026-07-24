export const maliciousPanelSamples = [
  { label: 'script tag', blocks: [{ type: 'paragraph', text: '<script>alert(1)</script>' }] },
  { label: 'img onerror', blocks: [{ type: 'paragraph', text: '<img onerror=alert(1) src=x>' }] },
  { label: 'https url', blocks: [{ type: 'paragraph', text: 'Visit https://evil.com now' }] },
  { label: 'javascript scheme', blocks: [{ type: 'paragraph', text: 'javascript:alert(1)' }] },
  { label: 'data uri', blocks: [{ type: 'paragraph', text: 'data:text/html,<script>' }] },
  { label: 'control char', blocks: [{ type: 'paragraph', text: 'hello\x00world' }] },
  { label: 'markdown link', blocks: [{ type: 'paragraph', text: '[click](javascript:alert(1))' }] },
  { label: 'unsafe list item', blocks: [{ type: 'list', items: ['safe', 'https://bad.com'] }] },
  { label: 'unsafe title', title: 'onclick=hack()', blocks: [{ type: 'paragraph', text: 'ok' }] },
  { label: 'unsafe question', prompt: '<img src=x onerror=alert(1)>', options: ['A'], correctIndex: 0 },
]

export const legitimatePanelSamples = [
  {
    title: 'Articles',
    blocks: [
      { type: 'heading', level: 2, text: 'Using a and an' },
      { type: 'paragraph', text: 'Use a before consonant sounds and an before vowel sounds.' },
      { type: 'example', text: 'a cat, an apple' },
      { type: 'list', items: ['a book', 'an hour', 'a university'] },
      { type: 'emphasis', text: 'Sound matters, not just the letter.' },
    ],
  },
  {
    title: 'Welcome',
    blocks: [{ type: 'paragraph', text: 'Welcome to English Pathway. Let us practise together.' }],
  },
]
