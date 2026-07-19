# Reduced-motion policy

English Pathway observes `prefers-reduced-motion: reduce` through the shared `useReducedMotion` hook and global CSS fallback.

| Source | Reduced-motion behavior | Equivalent feedback |
| --- | --- | --- |
| Page and icon transitions | Render immediately without translation or rotation | Navigation and selected state remain textual/semantic |
| Activity transitions | Skip entrance, exit, hover, and tap transforms | Correctness and progress stay in live regions |
| Activity result | Disable confetti and scale entrance | Score, stars, title, and retry control remain visible and announced |
| Flashcards | Flip switches immediately | Current face is announced in the live region |
| Microphone visualizer | Uses static bars and avoids audio-frame animation work | Text states that microphone input is active |
| CSS transitions and loaders | Global media query reduces duration to near-zero | Loading and status text remain available |

Manual verification: enable the operating-system reduced-motion preference, reload the app, navigate public pages, dashboard, learn, review, and settings, then complete one animated activity and one voice flow. Confirm that state remains understandable without visual movement.
