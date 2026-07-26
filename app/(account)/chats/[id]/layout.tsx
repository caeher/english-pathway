import { PANEL_FULL_BLEED_CLASS } from '@/lib/layout/panel-shell'

export default function ChatConversationLayout({ children }: { children: React.ReactNode }) {
  return <div className={PANEL_FULL_BLEED_CLASS}>{children}</div>
}
