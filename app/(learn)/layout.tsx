import Header from '@/components/Header'

export const metadata = {
  title: 'Learn — English Pathway',
  description: 'Practice English with your AI voice tutor and interactive activities.',
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  )
}
