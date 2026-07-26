export interface ElementScrollMetrics {
  scrollHeight: number
  clientHeight: number
  scrollTop: number
  overflowY: string
}

export interface PanelScrollMetrics {
  html: Pick<ElementScrollMetrics, 'scrollHeight' | 'clientHeight'>
  body: Pick<ElementScrollMetrics, 'scrollHeight' | 'clientHeight'>
  windowScrollY: number
  main: ElementScrollMetrics | null
  transition: Pick<ElementScrollMetrics, 'scrollHeight' | 'clientHeight'> | null
}

const SCROLL_TOLERANCE_PX = 2

export function measurePanelScroll(): PanelScrollMetrics {
  const main = document.querySelector<HTMLElement>('main#main-content')
  const transition = main?.firstElementChild as HTMLElement | null

  return {
    html: {
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    },
    body: {
      scrollHeight: document.body.scrollHeight,
      clientHeight: document.body.clientHeight,
    },
    windowScrollY: window.scrollY,
    main: main
      ? {
          scrollHeight: main.scrollHeight,
          clientHeight: main.clientHeight,
          scrollTop: main.scrollTop,
          overflowY: getComputedStyle(main).overflowY,
        }
      : null,
    transition: transition
      ? {
          scrollHeight: transition.scrollHeight,
          clientHeight: transition.clientHeight,
        }
      : null,
  }
}

export function documentHasVerticalScroll(tolerance = SCROLL_TOLERANCE_PX): boolean {
  return document.documentElement.scrollHeight - document.documentElement.clientHeight > tolerance
}

export function isMainPanelScroller(tolerance = SCROLL_TOLERANCE_PX): boolean {
  const main = document.querySelector<HTMLElement>('main#main-content')
  if (!main) return false
  const overflowY = getComputedStyle(main).overflowY
  const canScroll = overflowY === 'auto' || overflowY === 'scroll'
  const mainOverflows = main.scrollHeight - main.clientHeight > tolerance
  return canScroll && mainOverflows && !documentHasVerticalScroll(tolerance)
}
