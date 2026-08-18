import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getNavigationContext } from '@/lib/navigation'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const navigation = await getNavigationContext()
  return (
    <div className="flex min-h-screen flex-col dot-grid noise-overlay">
      <Header navigation={navigation} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

