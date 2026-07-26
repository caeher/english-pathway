import { PANEL_FULL_BLEED_CLASS, PANEL_PAGE_FILL_CLASS } from '@/lib/layout/panel-shell'

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={PANEL_PAGE_FILL_CLASS}>
      <div className={PANEL_FULL_BLEED_CLASS}>{children}</div>
    </div>
  )
}
