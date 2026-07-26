export const metadata = {
  title: 'Learn — English Pathway',
  description: 'Practice English with your AI voice tutor and interactive activities.',
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-(--bg-primary)">
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
