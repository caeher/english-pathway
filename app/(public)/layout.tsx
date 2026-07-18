import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen dot-grid noise-overlay">
      <Header isAuthenticated={Boolean(user)} />
      <main>{children}</main>
    </div>
  )
}
