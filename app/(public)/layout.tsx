import Header from '@/components/Header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen dot-grid noise-overlay">
      <Header />
      <main>{children}</main>
    </div>
  )
}
