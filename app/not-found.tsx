import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-primary) px-6">
      <div className="text-center space-y-4">
        <h1 className="font-display font-black text-6xl text-(--accent)">404</h1>
        <h2 className="font-display font-bold text-xl text-(--text-primary)">Page not found</h2>
        <p className="text-(--text-secondary)">The page you are looking for does not exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
