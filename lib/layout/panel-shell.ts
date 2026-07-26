import type { CSSProperties } from 'react'

/**
 * Shared panel shell gutters for DashboardLayout and full-bleed account routes.
 * Set on the DashboardLayout root so child routes can reference the same vars.
 */
export const PANEL_SHELL_CSS_VARS = {
  '--app-header-h': '4rem',
  '--app-panel-px': '1rem',
  '--app-panel-px-lg': '1.5rem',
  '--app-panel-pt': '1rem',
  '--app-panel-pt-lg': '1.5rem',
  '--app-panel-pb': '2rem',
  '--app-panel-pb-lg': '2.5rem',
} as const satisfies Record<string, string>

export const PANEL_SHELL_STYLE = PANEL_SHELL_CSS_VARS as CSSProperties

export const PANEL_CONTENT_COLUMN_CLASS =
  'flex min-h-0 flex-1 flex-col min-w-0 overflow-hidden'

/** Constrains the panel main region to the remaining viewport height. */
export const PANEL_MAIN_CLASS =
  'flex h-0 min-h-0 flex-1 flex-col overflow-hidden outline-none'

/** Single scroll owner for standard account pages inside the panel shell. */
export const PANEL_MAIN_SCROLL_CLASS =
  'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain ' +
  'px-[var(--app-panel-px)] pt-[var(--app-panel-pt)] pb-[max(var(--app-panel-pb),env(safe-area-inset-bottom))] ' +
  'lg:px-[var(--app-panel-px-lg)] lg:pt-[var(--app-panel-pt-lg)] lg:pb-[max(var(--app-panel-pb-lg),env(safe-area-inset-bottom))]'

/** Fills the panel main area for routes that need constrained height + inner scroll. */
export const PANEL_PAGE_FILL_CLASS =
  'flex h-0 min-h-0 flex-1 flex-col overflow-hidden'

/** Cancels shell gutters for routes that need edge-to-edge height inside the panel. */
export const PANEL_FULL_BLEED_CLASS =
  'flex flex-1 min-h-0 flex-col ' +
  '-mx-[var(--app-panel-px)] -mb-[var(--app-panel-pb)] ' +
  'lg:-mx-[var(--app-panel-px-lg)] lg:-mb-[var(--app-panel-pb-lg)]'
