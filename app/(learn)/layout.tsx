import Header from '@/components/Header'
import { getNavigationContext } from '@/lib/navigation'

export const metadata = {
  title: 'Learn — English Pathway',
  description: 'Practice English with your AI voice tutor and interactive activities.',
}

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const navigation = await getNavigationContext()
  return (
    <>
      <Header navigation={navigation} />
      <main>{children}</main>
    </>
  )
}
