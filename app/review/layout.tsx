import Header from '@/components/Header'
import { getNavigationContext } from '@/lib/navigation'

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
  const navigation = await getNavigationContext()
  return <><Header navigation={navigation} /><main>{children}</main></>
}
