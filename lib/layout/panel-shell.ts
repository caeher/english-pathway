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

export const PANEL_MAIN_CLASS =
  'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain outline-none ' +
  'px-[var(--app-panel-px)] pt-[var(--app-panel-pt)] pb-[max(var(--app-panel-pb),env(safe-area-inset-bottom))] ' +
  'lg:px-[var(--app-panel-px-lg)] lg:pt-[var(--app-panel-pt-lg)] lg:pb-[max(var(--app-panel-pb-lg),env(safe-area-inset-bottom))]'

/** Cancels shell gutters for routes that need edge-to-edge height inside the panel. */
export const PANEL_FULL_BLEED_CLASS =
  'flex flex-col ' +
  '-mx-[var(--app-panel-px)] -mb-[var(--app-panel-pb)] ' +
  'min-h-[calc(100dvh-var(--app-header-h)-var(--app-panel-pt)-var(--app-panel-pb))] ' +
  'lg:-mx-[var(--app-panel-px-lg)] lg:-mb-[var(--app-panel-pb-lg)] ' +
  'lg:min-h-[calc(100dvh-var(--app-header-h)-var(--app-panel-pt-lg)-var(--app-panel-pb-lg))]'
