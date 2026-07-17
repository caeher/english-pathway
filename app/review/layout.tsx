import Header from '@/components/Header'

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <><Header /><main>{children}</main></>
}
