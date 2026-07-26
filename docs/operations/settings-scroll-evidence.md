# Settings scroll layout — diagnostic evidence

Use this template when verifying `/settings` scroll behavior in deployed and local production builds.

## Environment

| Field | Value |
|-------|-------|
| URL | `https://english-pathway.cubepath.caeher.com/settings` |
| Viewport | Desktop: 1440×900 · Mobile: 390×844 |
| Zoom | 100% |
| Browser | Chrome / Brave (version) |
| Date | YYYY-MM-DD |

## Deploy verification

| Check | Result |
|-------|--------|
| Deployed commit SHA | |
| Includes `b96a18f` (dvh shell + fill transition) | yes / no |
| Dashboard bundle uses `h-dvh` (not `h-screen`) | yes / no |
| CDN / asset cache invalidated after deploy | yes / no |

**2026-07-26 pre-fix note:** Production login HTML referenced `h-screen` in inline payload while local `main` uses `h-dvh max-h-dvh`. Treat production as **behind** layout fix commits until redeploy confirms `h-dvh` in the served dashboard shell.

## Runtime metrics (`measurePanelScroll`)

Use `measurePanelScroll()` from `lib/layout/measure-panel-scroll.ts` in DevTools on `/settings` after a production build.

Record at three points: initial load, after scrolling `#main-content` to end, after attempting document scroll.

| Metric | Initial | Panel end | Document wheel |
|--------|---------|-----------|----------------|
| `html.scrollHeight` | | | |
| `html.clientHeight` | | | |
| `body.scrollHeight` | | | |
| `body.clientHeight` | | | |
| `window.scrollY` | | | |
| `main.scrollHeight` | | | |
| `main.clientHeight` | | | |
| `main.overflowY` | | | |
| `transition.scrollHeight` | | | |
| `transition.overflowY` | | | |

## Isolation toggles

Toggle one at a time in DevTools (do not include session data in reports):

| Component hidden | Document scroll removed? |
|------------------|-------------------------|
| PageTransition wrapper | |
| EnglishAssistant | |
| CookieConsentBanner | |
| Toaster | |
| Sidebar mobile overlay | |

## Acceptance

- [ ] `html.scrollHeight ≈ html.clientHeight` (±1px)
- [ ] `window.scrollY === 0` while scrolling Settings
- [ ] Only `#main-content` scrolls vertically when content overflows
- [ ] "Save changes" visible at panel bottom with gutter, no empty page below
- [ ] `/review` and `/chats/[id]` unchanged
