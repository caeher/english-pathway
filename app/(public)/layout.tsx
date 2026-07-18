import Header from '@/components/Header'
import { getNavigationContext } from '@/lib/navigation'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const navigation = await getNavigationContext()
  return (
    <div className="min-h-screen dot-grid noise-overlay">
      <Header navigation={navigation} />
      <main>{children}</main>
    </div>
  )
}
