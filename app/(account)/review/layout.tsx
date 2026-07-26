export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -mb-4 flex min-h-[calc(100dvh-var(--app-header-h)-2rem)] flex-col lg:-mx-6 lg:-mb-6">
      {children}
    </div>
  )
}
